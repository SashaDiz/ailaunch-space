"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Megaphone,
  Monitor,
  PanelRight,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ImageUpload from "@/components/forms/ImageUpload";
import {
  advertisingConfig,
  placementKeys,
  type PlacementKey,
} from "@/config/advertising.config";
import { siteConfig } from "@/config/site.config";

const { placements: placementConfig, durationDays, bundleDiscountPercent, ctaMaxLength } =
  advertisingConfig.promotions;

const PLACEMENT_ICONS: Record<PlacementKey, LucideIcon> = {
  banner: Monitor,
  rail: PanelRight,
  logo: ImageIcon,
  detailPage: FileText,
};

const placementOptions = placementKeys.map((key) => ({
  key,
  ...placementConfig[key],
  icon: PLACEMENT_ICONS[key],
}));

const NOTHING_SELECTED = Object.fromEntries(
  placementKeys.map((key) => [key, false])
) as Record<PlacementKey, boolean>;

type Availability = Partial<
  Record<PlacementKey, { available: boolean; nextOpening: string | null }>
>;

const SIGN_IN_URL = "/auth/signin?callbackUrl=/promote";

const formatMoney = (amount: number) =>
  Number.isInteger(amount) ? String(amount) : amount.toFixed(2);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function PromotePage() {
  return (
    <Suspense>
      <PromotePageContent />
    </Suspense>
  );
}

function PromotePageContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [wordmarkUrl, setWordmarkUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [catalogDetailText, setCatalogDetailText] = useState("");
  const [placements, setPlacements] = useState(NOTHING_SELECTED);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});

  // Fetch placement availability on mount
  useEffect(() => {
    fetch("/api/promotions?type=availability")
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data) {
          const next: Availability = json.data;
          setAvailability(next);
          // Deselect any sold-out placements
          setPlacements((prev) =>
            Object.fromEntries(
              placementKeys.map((key) => [key, prev[key] && next[key]?.available !== false])
            ) as Record<PlacementKey, boolean>
          );
        }
      })
      .catch(() => {});
  }, []);

  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";

  const isSoldOut = (key: PlacementKey) => availability[key]?.available === false;
  const hasAnyPlacement = placementKeys.some((key) => placements[key]);
  const bundleBookable = !placementKeys.some(isSoldOut);
  const allSelected = placementKeys.every((key) => placements[key]);
  const subtotal = placementOptions.reduce(
    (sum, opt) => sum + (placements[opt.key] ? opt.price : 0),
    0
  );
  // To the cent, as Dodo charges it: rounding here would quote $102 for a $102.20 checkout.
  const discountAmount = allSelected ? Math.round(subtotal * bundleDiscountPercent * 100) / 100 : 0;
  const total = subtotal - discountAmount;

  const togglePlacement = (key: PlacementKey) => {
    if (isSoldOut(key)) return;
    setPlacements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(SIGN_IN_URL);
      return;
    }

    if (!logoUrl) {
      toast.error("Please upload a logo.");
      return;
    }

    if (!hasAnyPlacement) {
      toast.error("Please select at least one placement type.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          short_description: shortDescription,
          logo_url: logoUrl,
          wordmark_url: placements.logo && wordmarkUrl ? wordmarkUrl : undefined,
          website_url: websiteUrl,
          cta_text: ctaText || undefined,
          banner_text: bannerText || undefined,
          catalog_detail_text: catalogDetailText || undefined,
          ...Object.fromEntries(
            placementOptions.map((opt) => [opt.column, placements[opt.key]])
          ),
        }),
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Your spot is booked</h2>
            <p className="text-muted-foreground mb-6">
              Your ad runs on {siteConfig.name} for {durationDays} days and may take a few minutes
              to appear. You won&apos;t be charged again.
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Payment canceled</h2>
            <p className="text-muted-foreground mb-6">
              Your spot was not booked. You can try again anytime.
            </p>
            <Button onClick={() => router.push("/promote")} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero */}
      <div className="bg-transparent py-8 pt-16">
        <div className="container-classic text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 text-foreground rounded-full font-semibold text-sm bg-muted">
              <Megaphone className="w-4 h-4 mr-2" strokeWidth={2} />
              Advertise
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Advertise on {siteConfig.name}
          </h1>
          <p className="text-lg font-normal text-muted-foreground max-w-xl mx-auto">
            Pay once and keep your spot for {durationDays} days. No subscription, no auto-renewal.
          </p>
        </div>
      </div>

      <div className="container-classic py-8 pb-16 max-w-2xl">
        {/* Prices are public; booking needs an account. */}
        {!userLoading && (
          <Card>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Placement selection */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Choose Placements
                    </h3>
                    {bundleBookable && (
                      <Badge variant="secondary" className="font-normal text-xs bg-primary/10 text-primary border border-primary/20">
                        Save {Math.round(bundleDiscountPercent * 100)}% when you book all {placementKeys.length}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select where your ad will appear. It goes live after payment and stays in place
                    for {durationDays} days, then comes down automatically.
                  </p>
                  <div className="space-y-3">
                    {placementOptions.map((opt) => {
                      const selected = placements[opt.key];
                      const soldOut = isSoldOut(opt.key);
                      const nextOpening = availability[opt.key]?.nextOpening;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => togglePlacement(opt.key)}
                          disabled={soldOut}
                          className={`w-full flex items-start gap-4 p-4 rounded-[var(--radius)] border text-left transition-colors ${
                            soldOut
                              ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                              : selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-[var(--radius)] flex items-center justify-center ${
                              soldOut
                                ? "bg-muted text-muted-foreground"
                                : selected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${soldOut ? "text-muted-foreground" : "text-foreground"}`}>{opt.name}</span>
                              {soldOut && (
                                <Badge variant="secondary" className="text-xs">
                                  {nextOpening ? `Next spot ${formatDate(nextOpening)}` : "Sold out"}
                                </Badge>
                              )}
                              {!soldOut && selected && (
                                <Badge className="bg-primary/20 text-primary text-xs">Selected</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`font-semibold text-sm ${soldOut ? "text-muted-foreground" : "text-foreground"}`}>${opt.price}</span>
                            <span className="text-muted-foreground text-xs"> / {durationDays} days</span>
                          </div>
                          <div className="flex-shrink-0">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                soldOut
                                  ? "border-muted-foreground/30"
                                  : selected
                                    ? "border-primary bg-primary"
                                    : "border-border"
                              }`}
                            >
                              {!soldOut && selected && (
                                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {hasAnyPlacement && (
                    <div className="mt-4 p-4 rounded-[var(--radius)] bg-muted/50 border border-border">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>${subtotal}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-primary">
                            <span>Discount</span>
                            <span>-${formatMoney(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
                          <span>Total for {durationDays} days</span>
                          <span>${formatMoney(total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {!user && (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Sign in to add your ad and book a spot.</p>
                    <Button type="button" onClick={() => router.push(SIGN_IN_URL)}>Sign In</Button>
                  </div>
                )}

                {/* Ad creative form */}
                {user && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Ad Creative
                  </h3>

                  <div className="space-y-6">
                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Square Logo <span className="text-destructive">*</span>
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Square image, at least 200x200px. PNG, JPG, or SVG.
                      </p>
                      <ImageUpload
                        value={logoUrl}
                        onChange={setLogoUrl}
                        error={null}
                      />
                    </div>

                    {/* Wordmark */}
                    {placements.logo && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Homepage Logo
                        </label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Optional. A transparent wordmark for the sponsors row. Without it we use your square logo.
                        </p>
                        <ImageUpload
                          value={wordmarkUrl}
                          onChange={setWordmarkUrl}
                          error={null}
                          formatHint="Transparent background. Any aspect ratio."
                        />
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Project Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                        placeholder="My Awesome App"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Short Description <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        maxLength={200}
                        required
                        rows={3}
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground resize-none"
                        placeholder="A short pitch for your project..."
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {shortDescription.length}/200
                      </p>
                    </div>

                    {/* Website URL */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Destination URL <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* CTA Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        CTA Button Text
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Optional. Max {ctaMaxLength} characters. Default: &quot;Visit {name || "Project"}&quot;
                        </p>
                      </div>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => {
                          if (e.target.value.length <= ctaMaxLength) {
                            setCtaText(e.target.value);
                          }
                        }}
                        maxLength={ctaMaxLength}
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                        placeholder="Try Free"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {ctaText.length}/{ctaMaxLength}
                      </p>
                    </div>

                    {/* Top Banner Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Top Banner Text
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Optional. Replaces the description on the top banner. Max 50 characters.
                        </p>
                      </div>
                      <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => {
                          if (e.target.value.length <= 50) setBannerText(e.target.value);
                        }}
                        maxLength={50}
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                        placeholder="Headline for the top banner"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {bannerText.length}/50
                      </p>
                    </div>

                    {/* Card Text */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Card Text
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Optional. Replaces the description on side rail and project page cards. Max 100 characters.
                        </p>
                      </div>
                      <input
                        type="text"
                        value={catalogDetailText}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) setCatalogDetailText(e.target.value);
                        }}
                        maxLength={100}
                        className="w-full px-4 py-2.5 text-sm border border-border rounded-[var(--radius)] focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none bg-background text-foreground"
                        placeholder="Text for side rail and project page cards"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {catalogDetailText.length}/100
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {user && (
                <Button
                  type="submit"
                  disabled={submitting || !name || !shortDescription || !logoUrl || !websiteUrl || !hasAnyPlacement}
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
                      <Megaphone className="w-4 h-4 mr-2" />
                      Continue to Payment
                      {hasAnyPlacement && (
                        <span className="ml-2 font-semibold opacity-90">
                          — ${formatMoney(total)}
                        </span>
                      )}
                    </>
                  )}
                </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
