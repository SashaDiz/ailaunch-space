/**
 * Validate a redirect target that came from user input (`?callbackUrl=`, `?next=`).
 *
 * An unvalidated value lets an attacker send `/auth/signin?callbackUrl=https://evil.example`
 * — the victim starts on the real domain and is bounced off it, which is what makes
 * open redirects useful for phishing and for stealing OAuth codes.
 *
 * Only same-origin, path-relative targets are allowed:
 *   "/dashboard"      → ok
 *   "//evil.example"  → rejected (protocol-relative URL)
 *   "https://evil"    → rejected
 *   "/\\evil.example" → rejected (backslash is treated as "/" by some browsers)
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0) return fallback;

  // Must be path-relative.
  if (!value.startsWith("/")) return fallback;
  // Protocol-relative ("//host") and backslash variants ("/\host") are absolute.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Reject control characters and anything that could smuggle a scheme.
  if (/[\x00-\x1f\x7f]/.test(value)) return fallback;

  return value;
}
