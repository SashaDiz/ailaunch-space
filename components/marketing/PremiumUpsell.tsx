"use client";

import React, { useState } from "react";
import { Crown, Link as LinkIcon, Rocket, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { siteConfig } from "@/config/site.config";
import { getPlan } from "@/config/plans.config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PREMIUM_PRICE = getPlan("premium")?.price ?? 4.99;
const MONTHLY_VISITORS = "10,000";
const REVIEW_TIME = "about 2 weeks";

function PremiumBenefits() {
  const items = [
    { icon: Zap, text: "Published right away — no review, no 2-week wait" },
    { icon: LinkIcon, text: "Lifetime dofollow link — no badge to keep on your site" },
    {
      icon: Crown,
      text: `Shown at the top of ${siteConfig.name}, in front of ~${MONTHLY_VISITORS} visitors a month`,
    },
  ];
  return (
    <ul className="space-y-2">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-2 text-sm text-foreground">
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Shown above the Submit button while the free plan is selected. */
export function PremiumUpsellCard({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="mt-8 rounded-xl border-2 border-foreground bg-muted/40 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold text-foreground">
              Skip the {REVIEW_TIME} review — go Premium for ${PREMIUM_PRICE}
            </p>
            <p className="text-sm text-muted-foreground">
              Free listings wait in the review queue. Premium goes live the moment you pay.
            </p>
          </div>
          <PremiumBenefits />
        </div>
        <button
          type="button"
          onClick={onSwitch}
          className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-5 py-3 text-sm font-semibold text-background transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]"
        >
          <Rocket className="h-4 w-4" strokeWidth={2} />
          Switch to Premium — ${PREMIUM_PRICE}
        </button>
      </div>
    </div>
  );
}

/** Shown after a free submission: the listing is queued; offer to skip the queue. */
export function SubmittedUpsellDialog({
  project,
  onClose,
}: {
  project: { slug: string; name: string } | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.slug}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const result = await response.json();
      const checkoutUrl = result?.data?.checkoutUrl;
      if (!response.ok || !checkoutUrl) throw new Error(result?.error || "Upgrade failed");
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Premium upgrade from submit dialog failed:", error);
      toast.error("Could not start the payment. You can upgrade later from your dashboard.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!project} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your project is submitted and waiting for review</DialogTitle>
          <DialogDescription>
            We are getting a lot of submissions, so review of free listings takes {REVIEW_TIME}.
            Keep our badge on your site during that time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Don't want to wait? Pay ${PREMIUM_PRICE} once and {project?.name || "your project"} goes live today:
            </p>
            <PremiumBenefits />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={upgrade}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-5 py-3 text-sm font-semibold text-background transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Rocket className="h-4 w-4" strokeWidth={2} />
              )}
              {loading ? "Opening secure payment..." : `Go live now — $${PREMIUM_PRICE}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              No thanks, I'll wait for the review
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
