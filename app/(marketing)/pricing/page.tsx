import { Rocket } from "lucide-react";
import { PricingCard } from "@/components/marketing/PricingCard";
import { DomainRatingBadge } from "@/components/marketing/DomainRatingBadge";
import {
  advertisingConfig,
  minPlacementPrice,
  placementKeys,
} from "@/config/advertising.config";
import { siteConfig } from "@/config/site.config";

export async function generateMetadata() {
  return {
    title: `Pricing & Plans - ${siteConfig.name}`,
    description: `List your project or book a fixed ad spot for 30 days on ${siteConfig.name}.`,
    alternates: {
      canonical: `${siteConfig.url}/pricing`,
    },
    openGraph: {
      title: `Pricing & Plans - ${siteConfig.name}`,
      description: `List your project or book a fixed ad spot for 30 days on ${siteConfig.name}.`,
      type: "website",
    },
  };
}

const { durationDays, placements, bundleDiscountPercent } = advertisingConfig.promotions;
const bundlePercent = Math.round(bundleDiscountPercent * 100);

const plans = [
  {
    id: "standard",
    name: "Standard Listing",
    price: 0,
    currency: "USD",
    description: "Free listing in exchange for our badge",
    icon: "Globe" as const,
    features: [
      { text: "Free listing with a dofollow backlink — add our badge, we verify automatically", icon: "Link" as const },
      { text: "Dofollow link passes SEO value to grow your Domain Rating once your badge is verified", icon: "TrendingUp" as const },
      { text: "Admin review (24–48h)", icon: "Clock" as const },
      { text: "Listed in the directory alongside paid projects", icon: "Megaphone" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Get Started",
  },
  {
    id: "premium",
    name: "Premium Listing",
    price: 4.99,
    currency: "USD",
    description: "Pay once — guaranteed dofollow backlink, featured at the top",
    icon: "Medal" as const,
    features: [
      { text: "Featured listing with a guaranteed dofollow backlink — no badge required", icon: "Link" as const },
      { text: "High-authority dofollow link that grows your Domain Rating", icon: "TrendingUp" as const },
      { text: "Featured placement above free listings", icon: "Crown" as const },
      { text: "Priority review (skip the standard queue)", icon: "Clock" as const },
      { text: "Premium badge for credibility", icon: "Star" as const },
      { text: "Featured in newsletter to subscribers", icon: "Rocket" as const },
    ],
    limitations: [],
    popular: true,
    cta: "Premium Launch",
  },
  {
    id: "advertise",
    name: "Advertise",
    price: -1,
    currency: "USD",
    description: "Pay once, keep your spot for 30 days",
    icon: "Megaphone" as const,
    href: "/promote",
    priceLabel: `/ ${durationDays} days`,
    priceStartsAt: minPlacementPrice,
    features: [
      { text: `${placements.banner.name} on every page — $${placements.banner.price}`, icon: "Monitor" as const },
      { text: `${placements.rail.name} on every page — $${placements.rail.price}`, icon: "PanelRight" as const },
      { text: `${placements.logo.name} on the front page — $${placements.logo.price}`, icon: "Home" as const },
      { text: `${placements.detailPage.name} on project pages — $${placements.detailPage.price}`, icon: "FileText" as const },
      { text: `One payment, ${durationDays} days, no subscription or auto-renewal`, icon: "Clock" as const },
      { text: `Limited spots — save ${bundlePercent}% when you book all ${placementKeys.length}`, icon: "Star" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Book a Spot",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="bg-transparent py-8 pt-16">
        <div className="container-classic text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 text-foreground rounded-full font-semibold text-sm bg-muted">
              <Rocket className="w-4 h-4 mr-2" strokeWidth={2} />
              List your project
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Pricing & Plans
          </h1>
          <p className="text-lg font-normal text-muted-foreground max-w-xl mx-auto">
            List your project for free, go Premium, or book a fixed ad spot for 30 days.
          </p>
          <div className="mt-6 flex justify-center">
            <DomainRatingBadge />
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container-classic py-4 pb-16">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
