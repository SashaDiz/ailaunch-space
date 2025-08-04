import React, { useState, useEffect } from "react";
import { SessionContext } from "./SessionContextDefinition";

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development mode, just set session to null since we don't have API routes
    if (import.meta.env.DEV) {
      console.warn("Running in development mode - no session API available");
      setSession(null);
      setLoading(false);
      return;
    }

    // Fetch session from NextAuth (only in production)
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const sessionData = await response.json();
            setSession(sessionData.user ? sessionData : null);
          } else {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (provider, options = {}) => {
    if (import.meta.env.DEV) {
      console.warn("Sign in not available in development mode");
      return { success: false, error: "Development mode - no authentication" };
    }

    setLoading(true);
    try {
      if (provider === "email") {
        // Handle magic link sign in with Resend
        const response = await fetch("/api/auth/signin/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: options.email,
            callbackUrl: window.location.origin,
          }),
        });

        if (response.ok) {
          return {
            success: true,
            message: "Check your email for the magic link!",
          };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Failed to send magic link",
          };
        }
      } else {
        // Redirect to OAuth provider
        window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
          window.location.origin
        )}`;
        return { success: true };
      }
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (import.meta.env.DEV) {
      console.warn("Sign out not available in development mode");
      setSession(null);
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setSession(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
