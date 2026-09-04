import dns from "dns/promises";
import net from "net";

/**
 * SSRF-hardened fetch for any URL that ultimately comes from a user.
 *
 * Checking the scheme is not enough: `http://169.254.169.254/…` (cloud metadata),
 * `http://127.0.0.1:6379` (internal services) and `http://10.x.x.x` are all valid
 * https/http URLs. This helper resolves the hostname, refuses private, loopback,
 * link-local and reserved ranges, follows redirects **manually** so each hop is
 * re-validated (a public host can 302 to 127.0.0.1), and caps both time and
 * response size.
 *
 * Use this instead of bare fetch() whenever the URL is not a hardcoded constant.
 */

export interface SafeFetchOptions {
  /** Max redirect hops to follow. Default 3. */
  maxRedirects?: number;
  /** Abort after this many ms. Default 8000. */
  timeoutMs?: number;
  /** Max bytes to read from the body. Default 512 KB. */
  maxBytes?: number;
  /** Extra request headers. */
  headers?: Record<string, string>;
}

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

/** True when an IP literal belongs to a range that must never be reachable. */
export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 0) return true; // not an IP we can reason about — refuse

  if (version === 4) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0) return true;                        // 0.0.0.0/8 "this network"
    if (a === 10) return true;                       // private
    if (a === 127) return true;                      // loopback
    if (a === 169 && b === 254) return true;         // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true;         // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0) return true;           // IETF protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true;                       // multicast + reserved + broadcast
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;          // unspecified / loopback
  if (lower.startsWith("fe80")) return true;                    // link-local
  if (/^f[cd]/.test(lower)) return true;                        // unique local fc00::/7
  if (lower.startsWith("ff")) return true;                      // multicast
  // IPv4-mapped (::ffff:127.0.0.1) — re-check the embedded v4 address
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIp(mapped[1]);
  return false;
}

/** Resolve a hostname and throw if any resolved address is in a blocked range. */
async function assertHostAllowed(hostname: string): Promise<void> {
  // A bare IP in the URL never reaches DNS — check it directly.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new SsrfBlockedError(`Blocked address: ${hostname}`);
    }
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new SsrfBlockedError(`Cannot resolve host: ${hostname}`);
  }

  if (addresses.length === 0) {
    throw new SsrfBlockedError(`Cannot resolve host: ${hostname}`);
  }
  // Refuse if ANY answer is blocked — a DNS round-robin must not smuggle one in.
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfBlockedError(`Blocked address for ${hostname}: ${address}`);
    }
  }
}

/**
 * Fetch a user-supplied URL with SSRF protection.
 *
 * Returns the response body as text (already size-capped) plus the final status
 * and URL. Throws SsrfBlockedError when the target is not allowed.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<{ ok: boolean; status: number; url: string; text: string }> {
  const {
    maxRedirects = 3,
    timeoutMs = 8000,
    maxBytes = 512 * 1024,
    headers = {},
  } = options;

  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("Invalid URL");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        throw new SsrfBlockedError(`Blocked protocol: ${current.protocol}`);
      }
      // Re-validate on EVERY hop — this is the point of manual redirects.
      await assertHostAllowed(current.hostname);

      const response = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers,
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return { ok: false, status: response.status, url: current.toString(), text: "" };
        }
        current = new URL(location, current); // resolve relative redirects
        continue;
      }

      // Read at most maxBytes so a huge or endless body cannot exhaust memory.
      const text = await readCapped(response, maxBytes);
      return { ok: response.ok, status: response.status, url: current.toString(), text };
    }

    throw new SsrfBlockedError("Too many redirects");
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  try {
    await reader.cancel();
  } catch {
    // stream already closed — nothing to do
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    const room = merged.length - offset;
    if (room <= 0) break;
    merged.set(chunk.subarray(0, room), offset);
    offset += Math.min(chunk.byteLength, room);
  }
  return new TextDecoder().decode(merged);
}
