import { Rocket } from "lucide-react";
import { PricingCard } from "@/components/marketing/PricingCard";
import { advertisingConfig } from "@/config/advertising.config";
import { siteConfig } from "@/config/site.config";

export async function generateMetadata() {
  return {
    title: `Pricing & Plans - ${siteConfig.name}`,
    description: `List your project, sponsor the platform, or promote with targeted ad placements on ${siteConfig.name}.`,
    alternates: {
      canonical: `${siteConfig.url}/pricing`,
    },
    openGraph: {
      title: `Pricing & Plans - ${siteConfig.name}`,
      description: `List your project, sponsor the platform, or promote with targeted ad placements on ${siteConfig.name}.`,
      type: "website",
    },
  };
}

const plans = [
  {
    id: "standard",
    name: "Standard Listing",
    price: 0,
    currency: "USD",
    description: "Free dofollow backlink in exchange for our badge",
    icon: "Globe" as const,
    features: [
      { text: "Free dofollow backlink — install our badge on your site, we verify automatically", icon: "Link" as const },
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
    description: "Pay once, no badge required, featured at the top",
    icon: "Medal" as const,
    features: [
      { text: "Guaranteed dofollow backlink — no badge required", icon: "Link" as const },
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
    id: "sponsor",
    name: "Become a Sponsor",
    price: 29,
    currency: "USD",
    description: "Premium brand exposure across the platform",
    icon: "Handshake" as const,
    priceLabel: "/month",
    href: "/sponsor",
    features: [
      { text: "Logo in partners section on every page", icon: "Home" as const },
      { text: "Featured in email newsletters", icon: "Mail" as const },
      { text: "Only 8 sponsor slots available", icon: "Crown" as const },
      { text: "Direct link to your website", icon: "Link" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Become a Sponsor",
  },
  {
    id: "promote",
    name: "Promote Your Project",
    price: -1,
    currency: "USD",
    description: "Targeted ad placements with flexible pricing",
    icon: "Megaphone" as const,
    href: "/promote",
    priceStartsAt: advertisingConfig.promotions.minPricePerMonth,
    features: [
      { text: "Top banner ad on every page", icon: "Monitor" as const },
      { text: "Promoted card in catalog grid", icon: "LayoutGrid" as const },
      { text: "Promoted card on project pages", icon: "FileText" as const },
      { text: "Pick 1-3 placements, pay per type", icon: "Star" as const },
      { text: "Custom CTA button text", icon: "Megaphone" as const },
      { text: "Click tracking & impressions", icon: "Trophy" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Start Promoting",
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
            List your project, sponsor the platform, or promote with targeted ad placements.
          </p>
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
