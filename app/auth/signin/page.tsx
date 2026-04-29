"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, ChevronLeft } from "lucide-react";
import { useSupabase } from '@/components/shared/SupabaseProvider';
import { useUser } from '@/hooks/use-user';
import { isDemoMode } from '@/lib/demo';
import { siteConfig } from "@/config/site.config";
import toast from "react-hot-toast";

function SignInContent() {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  // Get callback URL from URL params or sessionStorage
  const [callbackUrl, setCallbackUrl] = useState("/");
  
  useEffect(() => {
    const urlCallback = searchParams.get("callbackUrl");
    const sessionCallback = sessionStorage.getItem("redirectAfterSignIn");
    
    // Prioritize URL param, then sessionStorage, then default to "/"
    const redirect = urlCallback || sessionCallback || "/";
    setCallbackUrl(redirect);
  }, [searchParams]);

  const error = searchParams.get("error");
  const errorDetails = searchParams.get("details");

  useEffect(() => {
    // Check if user is already signed in
    if (user) {
      // Clear the redirect URL from sessionStorage
      sessionStorage.removeItem("redirectAfterSignIn");
      // In demo mode, default to admin panel instead of homepage
      const target = isDemoMode() && callbackUrl === "/" ? "/admin" : callbackUrl;
      router.push(target);
    }
  }, [user, callbackUrl, router]);

  const handleSignIn = async (provider) => {
    setIsLoading({ ...isLoading, [provider]: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading({ ...isLoading, [provider]: false });
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || emailSent) return;

    setIsLoading({ ...isLoading, email: true });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        toast.success("Check your email for the magic link!");
      }
    } catch (error) {
      console.error("Email sign in error:", error);
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading({ ...isLoading, email: false });
    }
  };

  const getErrorMessage = (error, details) => {
    let baseMessage;
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
        baseMessage = "OAuth authentication failed. This usually means the callback URL is not properly configured.";
        break;
      case "AuthCallback":
        baseMessage = "Failed to complete authentication.";
        break;
      case "NoSession":
        baseMessage = "Authentication succeeded but no session was created.";
        break;
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
        baseMessage = "There was a problem creating your account.";
        break;
      case "OAuthAccountNotLinked":
        baseMessage = "This email is already associated with another account. Please use a different sign-in method.";
        break;
      case "EmailSignin":
        baseMessage = "Check your email for a sign-in link.";
        break;
      case "CredentialsSignin":
        baseMessage = "Invalid credentials. Please check your email and password.";
        break;
      case "SessionRequired":
        baseMessage = "Please sign in to access this page.";
        break;
      default:
        baseMessage = "An error occurred during sign in.";
    }
    
    return details ? `${baseMessage} Details: ${details}` : baseMessage;
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full rounded-[var(--radius)] border border-border/40 bg-background/80 backdrop-blur-md shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back
          </h2>
          <p className="text-muted-foreground">
            Sign in to your account to vote, submit projects, and track your
            launches.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{getErrorMessage(error, errorDetails)}</span>
          </div>
        )}

        {/* Sign In Form (transparent — outer card handles the backdrop) */}
        <div>
          <div className="">
            <div className="space-y-4">
              {/* Google Sign In */}
              <button
                onClick={() => handleSignIn("google")}
                disabled={isLoading.google}
                className="inline-flex items-center justify-center rounded-lg border-2 border-foreground px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors w-full disabled:opacity-50"
              >
                {isLoading.google ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </button>

            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 text-muted-foreground before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">or</div>

            {/* Email Magic Link */}
            <div className="space-y-4">
              {emailSent ? (
                <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-success">
                  <Mail className="w-5 h-5" />
                  <div>
                    <h4 className="font-semibold">Check your email!</h4>
                    <p className="text-sm">
                      We've sent a magic link to {email}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                      required
                      disabled={isLoading.email}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!email || isLoading.email}
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] w-full disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isLoading.email ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    Login with Email
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <Link
            href={callbackUrl}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to {siteConfig.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
