import React from "react";
import PricingCard from "../components/ui/PricingCard";
import FAQ from "../components/ui/FAQ";
import rocketIcon from "@/assets/rocket.svg";

const plans = [
  {
    title: "Standard Launch",
    price: "Free",
    features: [
      "List on homepage for a week",
      "Entry in weekly limited availability",
      "Regular, not top ranking position",
      "Nofollow links (Top 3 get dofollow)",
      "Standard launch queue",
    ],
    button: "Get Started",
    highlight: false,
    planId: "standard_launch",
  },
  {
    title: "Support Launch",
    price: "Requires backlink",
    features: [
      "List on homepage for a week",
      "Entry in weekly limited availability",
      "Regular, top 3 ranking position",
      "Immediate dofollow links",
      "Standard launch queue",
      "Social media promotion",
    ],
    button: "Get Listed",
    highlight: false,
    planId: "support_launch",
  },
  {
    title: "Premium Launch",
    price: "$15",
    periodLabel: "/ launch", // Only here!
    features: [
      "List on homepage for a week",
      "Top position (more visibility)",
      "Regular, top 3 weekly position",
      "Guaranteed dofollow links",
      "Social media promotion",
      "Skip the queue",
      "Premium badge",
    ],
    button: "Premium Launch",
    highlight: true,
    planId: "premium_launch",
  },
];

const faqs = [
  {
    q: "What is DirectoryHunt.org?",
    a: "A curated directory for discovering and launching new directories.",
  },
  {
    q: "How does it work?",
    a: "Submit your directory, choose a launch plan, and get featured on our homepage and newsletter.",
  },
  {
    q: "How much traffic can I expect?",
    a: "Traffic varies, but top listings and premium launches get the most visibility.",
  },
  {
    q: "Will this help with SEO?",
    a: "Yes, especially with premium and support launches that include high authority backlinks.",
  },
  {
    q: "Why should I list here?",
    a: "Get exposure, traffic, and SEO benefits for your directory.",
  },
  {
    q: "Is it free?",
    a: "Yes, there is a free plan available.",
  },
];

function PricingPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <section className="py-8 flex flex-col items-center">
        <span className="flex items-center border px-4 py-2 rounded-lg mb-4 text-sm">
          <img
            src={rocketIcon}
            alt="Rocket Icon"
            className="inline w-5 h-5 mr-1"
          />
          Launch your directory
        </span>
        <h1 className="text-5xl font-medium mb-3">Choose Your Launch Plan</h1>
        <p className="text-gray-900 text-center text-md mb-8">
          Choose the right launch type to unlock your project’s full potential.
          <br />
          <span className="text-sm text-center">
            All launches take place at 12:00 AM PST.
          </span>
        </p>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center">
          {plans.map((plan) => (
            <PricingCard key={plan.title} plan={plan} />
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto w-full mt-12 mb-24">
        <h2 className="text-3xl font-medium text-gray-900 text-center mb-4">
          FAQ
        </h2>
        <p className="text-center text-md text-gray-900 mb-6">
          Here are some frequently asked questions about our directory launches.
        </p>
        <FAQ faqs={faqs} />
      </section>
    </div>
  );
}

export default PricingPage;
