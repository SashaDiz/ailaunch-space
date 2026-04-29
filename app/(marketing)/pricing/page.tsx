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
    description: "Perfect for new projects and startups",
    icon: "Globe" as const,
    features: [
      { text: "Live on homepage for 7 days", icon: "Home" as const },
      { text: "15 slots weekly (limited availability)", icon: "Crown" as const },
      { text: "Standard listing queue", icon: "Clock" as const },
      { text: "Basic community exposure", icon: "Megaphone" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Get Started",
  },
  {
    id: "premium",
    name: "Premium Listing",
    price: 11.99,
    currency: "USD",
    description: "Maximum exposure for established projects",
    icon: "Medal" as const,
    features: [
      { text: "Extended homepage exposure (14 days)", icon: "Home" as const },
      { text: "Priority placement in top categories", icon: "Crown" as const },
      { text: "Guaranteed dofollow backlink from DR36+ domain", icon: "Link" as const },
      { text: "Skip the queue (10 extra slots weekly)", icon: "Clock" as const },
      { text: "Enhanced social media promotion", icon: "Megaphone" as const },
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
    price: 49,
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
  {
    id: "listbott",
    name: "Directory Submission",
    price: 499,
    currency: "USD",
    description: "Submit to 100+ directories automatically",
    icon: "Bot" as const,
    features: [
      { text: "Submit to 100+ hand-picked directories", icon: "CheckCircle2" as const },
      { text: "Save 60+ hours of manual work", icon: "Clock" as const },
      { text: "Guaranteed DR 15+ increase", icon: "Trophy" as const },
      { text: "Quality backlinks from 10,000+ database", icon: "Link" as const },
      { text: "Complete detailed report included", icon: "Star" as const },
      { text: "1 month delivery with weekly updates", icon: "Rocket" as const },
    ],
    limitations: [],
    popular: false,
    cta: "Submit with ListingBott",
    externalLink: process.env.NEXT_PUBLIC_LISTINGBOTT_URL || "#",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-card">
      {/* Hero Section */}
      <div className="bg-card py-8 pt-16">
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
