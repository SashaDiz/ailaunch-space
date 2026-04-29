"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Bot,
  Globe,
  Home,
  Crown,
  Clock,
  Megaphone,
  Medal,
  Link as LinkIcon,
  Star,
  Handshake,
  Mail,
  Monitor,
  LayoutGrid,
  FileText,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/config/site.config";

/** Icon names that can be passed from Server Components (serializable) */
export type PricingIconName =
  | "Globe"
  | "Home"
  | "Crown"
  | "Clock"
  | "Megaphone"
  | "Medal"
  | "Link"
  | "Star"
  | "Rocket"
  | "Handshake"
  | "Mail"
  | "Monitor"
  | "LayoutGrid"
  | "FileText"
  | "Trophy"
  | "Bot"
  | "CheckCircle2";

const ICON_MAP: Record<PricingIconName, LucideIcon> = {
  Globe,
  Home,
  Crown,
  Clock,
  Megaphone,
  Medal,
  Link: LinkIcon,
  Star,
  Rocket,
  Handshake,
  Mail,
  Monitor,
  LayoutGrid,
  FileText,
  Trophy,
  Bot,
  CheckCircle2,
};

export interface PricingPlanFeature {
  text: string;
  /** Icon name (serializable from Server) or LucideIcon (from Client Components) */
  icon: PricingIconName | LucideIcon;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  /** Icon name (serializable from Server) or LucideIcon (from Client Components) */
  icon: PricingIconName | LucideIcon;
  features: PricingPlanFeature[];
  limitations: string[];
  popular: boolean;
  cta: string;
  externalLink?: string;
  /** Custom price label (e.g. "/month") — overrides default logic */
  priceLabel?: string;
  /** Show "Starts at $X/month" (e.g. for promote plan) */
  priceStartsAt?: number;
  /** Internal link (uses Next router instead of submit flow) */
  href?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  index?: number;
  waitingTime?: string | null;
  loadingWaitingTime?: boolean;
  onLaunchClick?: (planId: string) => void;
}

export function PricingCard({
  plan,
  waitingTime,
  loadingWaitingTime,
  onLaunchClick,
}: PricingCardProps) {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent) => {
    if (plan.externalLink) {
      return;
    }
    e.preventDefault();
    if (plan.href) {
      router.push(plan.href);
      return;
    }
    if (onLaunchClick) {
      onLaunchClick(plan.id);
    } else {
      router.push(`/submit?plan=${plan.id}`);
    }
  };

  return (
    <div
      className={`rounded-[var(--radius)] bg-card border transition-all ${
        plan.popular ? "border-primary border-2" : "border-border"
      }`}
    >
      <div className="p-8 flex flex-col h-full">
        <div className="text-start">
          <h3 className="text-xl font-medium mb-4 text-muted-foreground">
            {plan.name}
          </h3>

          <div className="mb-6">
            {plan.priceStartsAt != null ? (
              <>
                <span className="text-muted-foreground text-base">Starts at </span>
                <span className="text-5xl font-bold text-foreground">${plan.priceStartsAt}</span>
                <span className="text-muted-foreground ml-2 text-base">/month</span>
              </>
            ) : (
              <>
                <span className="text-5xl font-bold text-foreground">
                  {plan.price === 0 ? "Free" : plan.price < 0 ? "Custom" : `$${plan.price}`}
                </span>
                {plan.price > 0 && plan.id !== "listbott" && (
                  <span className="text-muted-foreground ml-2 text-base">
                    {plan.priceLabel || "/ launch"}
                  </span>
                )}
                {plan.price < 0 && plan.priceLabel && (
                  <span className="text-muted-foreground ml-2 text-base">
                    {plan.priceLabel}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 mb-8 flex-grow">
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => {
              const IconComponent =
                typeof feature.icon === "string"
                  ? ICON_MAP[feature.icon]
                  : feature.icon;
              return (
              <li key={idx} className="flex items-start">
                {IconComponent && React.createElement(IconComponent, {
                  className:
                    "w-4 h-4 text-foreground mr-3 mt-0.5 flex-shrink-0",
                  strokeWidth: 1.5,
                })}
                <span className="text-sm text-foreground">
                  {feature.text}
                  {plan.id === "standard" &&
                    feature.text === "Standard listing queue" && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        {loadingWaitingTime ? (
                          <span className="opacity-60">(calculating...)</span>
                        ) : waitingTime ? (
                          <span>({waitingTime})</span>
                        ) : (
                          <span className="opacity-60">
                            (checking availability...)
                          </span>
                        )}
                      </span>
                    )}
                </span>
              </li>
              );
            })}
          </ul>

          {plan.limitations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="font-medium text-muted-foreground text-sm mb-3">
                Limitations:
              </h4>
              <ul className="space-y-2">
                {plan.limitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full mr-3 mt-2 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {limitation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {plan.externalLink ? (
          <div className="w-full mt-auto">
            <a
              href={plan.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block"
            >
              <button
                type="button"
                className={`w-full py-3 px-6 rounded-[var(--radius)] font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground border border-primary"
                    : "bg-background text-foreground border border-foreground"
                }`}
                style={plan.popular ? { boxShadow: "var(--card-shadow)" } : undefined}
              >
                {plan.id === "listbott" && (
                  <Bot className="w-4 h-4" strokeWidth={2} />
                )}
                {plan.popular && plan.id !== "listbott" && (
                  <Rocket className="w-4 h-4" strokeWidth={2} />
                )}
                {plan.cta}
              </button>
            </a>
            {plan.id === "listbott" && (
              <div className="mt-3 text-center">
                <a
                  href={`https://listingbott.com/?ref=${siteConfig.refParameter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Learn more about ListingBott
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full mt-auto">
            <button
              type="button"
              onClick={handleClick}
              className={`w-full py-3 px-6 rounded-[var(--radius)] font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 ${
                plan.popular
                  ? "bg-primary text-primary-foreground border border-primary"
                  : "bg-background text-foreground border border-foreground"
              }`}
              style={plan.popular ? { boxShadow: "var(--card-shadow)" } : undefined}
            >
              {plan.popular && <Rocket className="w-4 h-4" strokeWidth={2} />}
              {plan.cta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
