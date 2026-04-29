"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { isDemoMode, DEMO_USER_ID } from "@/lib/demo";
import toast from "react-hot-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getPathname(url: string): URL | null {
  try {
    return new URL(url, window.location.origin);
  } catch {
    return null;
  }
}

/** Should this request be intercepted and answered with a mock response? */
function shouldIntercept(url: string, method: string): boolean {
  const upper = method.toUpperCase();

  // Intercept all write requests to /api/*
  if (WRITE_METHODS.has(upper)) {
    const parsed = getPathname(url);
    return parsed ? parsed.pathname.startsWith("/api/") : false;
  }

  // Intercept specific GET requests that need client-side mocking
  if (upper === "GET") {
    const parsed = getPathname(url);
    if (!parsed) return false;
    // Mock user profile GET (prevents server-side user creation for demo user)
    if (parsed.pathname === "/api/user" && parsed.searchParams.get("type") === "profile") {
      return true;
    }
  }

  return false;
}

/** Build a mock Response matching the shape each endpoint returns. */
function createMockResponse(url: string, method: string): Response {
  const parsed = getPathname(url);
  const pathname = parsed?.pathname ?? url;

  // Mock user profile for AdminHeader
  if (method.toUpperCase() === "GET" && pathname === "/api/user") {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: DEMO_USER_ID,
          full_name: "Demo Admin",
          email: "demo@ailaunch.space",
          avatar_url: "",
          role: "admin",
          is_admin: true,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Default mock for write operations
  return new Response(
    JSON.stringify({
      success: true,
      demo: true,
      data: { id: crypto.randomUUID(), slug: `demo-${Date.now()}` },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

// ── Patch fetch at module load (before any component makes requests) ─────────

let originalFetch: typeof window.fetch | null = null;

if (typeof window !== "undefined" && isDemoMode()) {
  originalFetch = window.fetch;

  window.fetch = async function demoFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method || "GET";

    if (shouldIntercept(url, method)) {
      // Show toast only for write operations (not mocked GETs)
      if (WRITE_METHODS.has(method.toUpperCase())) {
        toast("Demo \u2014 changes won\u2019t be saved", {
          duration: 2000,
          icon: "\uD83D\uDD12",
          style: {
            background: "hsl(45 93% 47%)",
            color: "hsl(45 90% 10%)",
            border: "1px solid hsl(45 90% 40%)",
            fontSize: "13px",
            fontWeight: "500",
          },
        });
      }
      return createMockResponse(url, method);
    }

    return originalFetch!.call(window, input, init);
  };
}

// ── Provider component ───────────────────────────────────────────────────────

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const cleaned = useRef(false);

  // Cleanup: restore original fetch if component unmounts (HMR etc.)
  useEffect(() => {
    return () => {
      if (originalFetch && !cleaned.current) {
        window.fetch = originalFetch;
        cleaned.current = true;
      }
    };
  }, []);

  // Set CSS variable for demo banner height so fixed/sticky elements can offset
  const bannerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!isDemoMode()) return;
    const update = () => {
      const h = bannerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--demo-banner-h", `${h}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--demo-banner-h");
    };
  }, []);

  if (!isDemoMode()) return <>{children}</>;

  return (
    <>
      {/* Fixed demo banner */}
      <div
        ref={bannerRef}
        className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 text-center text-sm font-medium py-1.5 px-4 shadow-sm"
      >
        Demo Mode &mdash; All changes are temporary and will not be saved
        <button
          onClick={() => window.location.reload()}
          className="ml-3 underline hover:no-underline font-semibold"
        >
          Reset
        </button>
      </div>
      {/* Offset content by banner height */}
      <div style={{ paddingTop: "var(--demo-banner-h, 0px)" }}>{children}</div>
    </>
  );
}
