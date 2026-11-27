import { Rocket } from "lucide-react";
import { PricingCard } from "@/components/marketing/PricingCard";
import { DomainRatingBadge } from "@/components/marketing/DomainRatingBadge";
import { LiveStats } from "@/components/marketing/LiveStats";
import { siteConfig } from "@/config/site.config";

export async function generateMetadata() {
  return {
    title: `Submit your AI tool - ${siteConfig.name}`,
    description: `List your AI tool on ${siteConfig.name}: free with our badge, or Premium for a lifetime dofollow link and instant publishing.`,
    alternates: {
      canonical: `${siteConfig.url}/pricing`,
    },
    openGraph: {
      title: `Submit your AI tool - ${siteConfig.name}`,
      description: `List your AI tool on ${siteConfig.name}: free with our badge, or Premium for a lifetime dofollow link and instant publishing.`,
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
    description: "Free listing in exchange for our badge",
    icon: "Globe" as const,
    features: [
      { text: "Free listing with a dofollow backlink — add our badge, we verify automatically", icon: "Link" as const },
      { text: "Dofollow link passes SEO value to grow your Domain Rating once your badge is verified", icon: "TrendingUp" as const },
      { text: "Admin review takes about 2 weeks — we are getting a high volume of submissions", icon: "Clock" as const },
      { text: "Keep the badge on your site the whole time — while under review and after", icon: "Link" as const },
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
    description: "Pay once — live instantly, lifetime dofollow backlink, featured at the top",
    icon: "Medal" as const,
    features: [
      { text: "Lifetime dofollow backlink — no badge required", icon: "Link" as const },
      { text: "High-authority dofollow link that grows your Domain Rating", icon: "TrendingUp" as const },
      { text: "Shown at the top of the directory, above free listings", icon: "Crown" as const },
      { text: "No review wait — published the moment your payment goes through", icon: "Clock" as const },
      { text: "Premium badge for credibility", icon: "Star" as const },
      { text: "Featured in newsletter to subscribers", icon: "Rocket" as const },
    ],
    limitations: [],
    popular: true,
    cta: "Premium Launch",
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
              Submit your AI tool
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Launch on {siteConfig.name}
          </h1>
          <p className="text-lg font-normal text-muted-foreground max-w-xl mx-auto">
            Pick how to list it: free with our badge and a ~2 week review, or Premium to go live today with a lifetime dofollow link.
          </p>
          <div className="mt-6 flex justify-center">
            <DomainRatingBadge />
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container-classic py-4 pb-16">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              index={index}
            />
          ))}
        </div>

        {/* Real traffic, so the audience a listing or an ad reaches is visible. */}
        <div className="mt-12">
          <LiveStats
            heading={
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-foreground">Who will see your project</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Live numbers from the site: people browsing right now, visits over the last 30 days and where they come from.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
