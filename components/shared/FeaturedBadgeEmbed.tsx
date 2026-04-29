"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { siteConfig } from "@/config/site.config";

// Always use the production URL for the embed code so users don't paste a localhost link
// when copying the snippet during local development.
const PUBLIC_SITE_URL = "https://ailaunch.space";
const PUBLIC_SITE_NAME = "AILaunchSpace";
const siteDomain = "ailaunch.space";

/**
 * FeaturedBadgeEmbed Component
 * Displays embed code for featured badge with dofollow backlink verification
 * Used in the submission flow for standard (free) plan users
 */
export default function FeaturedBadgeEmbed({
  websiteUrl,
  onVerificationComplete,
  className = ""
}) {
  const [copied, setCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const badgePath = `/assets/Badges/featured${isDarkTheme ? '-dark' : ''}.svg`;
  const badgeUrl = `${PUBLIC_SITE_URL}${badgePath}`;

  const embedCode = `<a href="${PUBLIC_SITE_URL}/" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
  <img src="${badgeUrl}" alt="Featured on ${PUBLIC_SITE_NAME}" width="225" height="61" style="display: block;" />
</a>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success("Embed code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy embed code");
    }
  };

  const handleVerify = async () => {
    if (!websiteUrl) {
      toast.error("Please provide your website URL in the project details");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/verify-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });

      const result = await response.json();
      setVerificationResult(result);

      if (result.verified) {
        toast.success("Badge verified successfully!");
        if (onVerificationComplete) {
          onVerificationComplete(true);
        }
      }
    } catch (error) {
      setVerificationResult({
        success: false,
        verified: false,
        message: "Verification failed. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          Add Badge to Your Website
        </h3>
        <p className="text-muted-foreground">
          Place this badge on your website homepage with a dofollow link to get your project listed.
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Badge Style</h4>
            <p className="text-xs text-muted-foreground">Choose between light and dark badge style</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDarkTheme(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                !isDarkTheme
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIsDarkTheme(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                isDarkTheme
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <p className="text-muted-foreground font-medium">
          Step 1: Copy the HTML code and add it to your homepage:
        </p>
      </div>

      {/* Code Block */}
      <div className="relative mb-6">
        <div className="bg-muted border border-border rounded-xl p-4 text-sm font-mono text-foreground overflow-x-auto">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{embedCode}</code>
          </pre>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopyCode}
          className="absolute top-3 right-3 p-2 bg-card border border-border rounded-lg hover:bg-muted hover:border-foreground transition-colors duration-200 shadow-sm"
          title="Copy embed code"
        >
          {copied ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Badge Preview */}
      <div className="mb-6">
        <p className="text-muted-foreground font-medium mb-3">Badge preview:</p>
        <div className="inline-block p-4 rounded-xl border border-border bg-transparent">
          <a
            href={`${siteConfig.url}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:scale-105 transition-transform duration-200"
          >
            <img
              src={badgePath}
              alt={`Featured on ${siteDomain}`}
              width="225"
              height="61"
              className="block"
            />
          </a>
        </div>
      </div>

      {/* Verification Section */}
      <div className="border-t border-border pt-6">
        <p className="text-muted-foreground font-medium mb-4">
          Step 2: Verify badge placement on your website:
        </p>

        {websiteUrl && (
          <p className="text-sm text-muted-foreground mb-4">
            We will check: <span className="font-medium text-foreground">{websiteUrl}</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || !websiteUrl}
          className="w-full px-6 py-3 bg-background text-foreground border-2 border-foreground rounded-xl font-semibold hover:bg-muted transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Verify Badge Placement
            </>
          )}
        </button>

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              verificationResult.verified
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {verificationResult.verified ? (
                <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    verificationResult.verified ? "text-success" : "text-destructive"
                  }`}
                >
                  {verificationResult.verified ? "Badge Verified!" : "Badge Not Found"}
                </p>
                {!verificationResult.verified && (
                  <p className="text-sm mt-1 text-destructive">
                    {verificationResult.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-foreground/5 border border-foreground/20 rounded-xl">
        <p className="text-sm text-foreground font-medium">
          <strong>Why is this required?</strong> Standard listings are free in exchange for a
          dofollow link back to {PUBLIC_SITE_NAME}. We verify the badge automatically before
          your project goes live, and re-check periodically. Make sure the link does NOT have{" "}
          <code className="bg-muted px-1 rounded">rel="nofollow"</code>.
        </p>
      </div>
    </div>
  );
}
