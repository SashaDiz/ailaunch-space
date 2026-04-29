"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Handshake, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ImageUpload from "@/components/forms/ImageUpload";
import { advertisingConfig } from "@/config/advertising.config";
import { siteConfig } from "@/config/site.config";

export default function SponsorPage() {
  return (
    <Suspense>
      <SponsorPageContent />
    </Suspense>
  );
}

function SponsorPageContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sponsorCount, setSponsorCount] = useState<number | null>(null);

  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";
  const maxSponsors = advertisingConfig.sponsors.maxSponsors;
  const isSoldOut = sponsorCount !== null && sponsorCount >= maxSponsors;

  // Fetch current sponsor count
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const json = await res.json();
          setSponsorCount(json.data?.length ?? 0);
        }
      } catch {
        // ignore
      }
    }
    fetchCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/signin");
      return;
    }

    const trimmedWebsite = websiteUrl.trim();
    if (!logo) {
      toast.error("Please upload a logo.");
      return;
    }
    if (!trimmedWebsite) {
      toast.error("Please enter your website URL.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, logo, website_url: trimmedWebsite }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit");
      }

      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome aboard!</h2>
            <p className="text-muted-foreground mb-6">
              Your sponsorship is now active. Your logo will appear on {siteConfig.name} shortly.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Back to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Canceled state
  if (isCanceled) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Payment canceled</h2>
            <p className="text-muted-foreground mb-6">
              Your sponsorship was not completed. You can try again anytime.
            </p>
            <Button onClick={() => router.push("/sponsor")} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Hero */}
      <div className="bg-card py-8 pt-16">
        <div className="container-classic text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 text-foreground rounded-full font-semibold text-sm bg-muted">
              <Handshake className="w-4 h-4 mr-2" strokeWidth={2} />
              Become a Sponsor
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Sponsor {siteConfig.name}
          </h1>
          <p className="text-lg font-normal text-muted-foreground max-w-xl mx-auto">
            Get your brand in front of thousands of visitors. Your logo will be displayed prominently
            in our partners section and included in email newsletters.
          </p>
        </div>
      </div>

      <div className="container-classic py-8 pb-16 max-w-2xl">
        {/* Sold out */}
        {isSoldOut && (
          <Card className="mb-8 border-yellow-500/50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">All sponsor slots are filled</h3>
              <p className="text-muted-foreground text-sm">
                We currently have {maxSponsors}/{maxSponsors} active sponsors. Check back later or{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="underline">contact us</a> to join the waitlist.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sponsor slots counter */}
        {!isSoldOut && sponsorCount !== null && (
          <div className="text-center mb-8">
            <span className="text-sm text-muted-foreground">
              {maxSponsors - sponsorCount} of {maxSponsors} sponsor slots available
            </span>
          </div>
        )}

        {/* Auth check */}
        {!userLoading && !user && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Please sign in to become a sponsor.</p>
              <Button onClick={() => router.push("/signin")}>Sign In</Button>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {user && !isSoldOut && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Logo <span className="text-destructive">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    PNG or SVG with transparent background. Any aspect ratio.
                  </p>
                  <ImageUpload
                    value={logo}
                    onChange={setLogo}
                    error={null}
                    formatHint="Transparent background. Any aspect ratio."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2" htmlFor="sponsor-description">
                    Short Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="sponsor-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground resize-none"
                    placeholder="A short description of your company or project..."
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {description.length}/200
                  </p>
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2" htmlFor="sponsor-website-url">
                    Website URL <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="sponsor-website-url"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                    placeholder="https://example.com"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !description || !logo || !websiteUrl.trim()}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <Handshake className="w-4 h-4 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
