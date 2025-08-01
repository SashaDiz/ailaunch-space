import React, { createContext, useContext, useState, useEffect } from "react";

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session from NextAuth
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const sessionData = await response.json();
          setSession(sessionData.user ? sessionData : null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (provider, options = {}) => {
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

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
