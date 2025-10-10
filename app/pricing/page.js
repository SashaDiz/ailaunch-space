"use client";

import React from "react";
import Link from "next/link";
import {
  Check,
  Star,
  Group,
  Plus,
  ShieldCheck,
  Globe,
  Medal,
  BadgeCheck,
  Flash,
} from "iconoir-react";

const plans = [
  {
    id: "standard",
    name: "Standard Launch",
    price: 0,
    currency: "USD",
    description: "Perfect for new AI projects and startups",
    icon: Globe,
    features: [
      "Live on homepage for 7 days",
      "Badge for top 3 ranking products",
      "High authority backlink for top 3 winners",
      "Standard launch queue",
      "15 slots available per week",
      "Community voting access",
      "Permanent AI project entry",
    ],
    limitations: [],
    popular: false,
    cta: "Get Started",
    ctaClass: "btn-outline",
  },
  {
    id: "premium",
    name: "Premium Launch",
    price: 15,
    currency: "USD",
    description: "Maximum exposure for established AI projects",
    icon: Medal,
    features: [
      "Live on homepage for 7 days",
      "Badge for top 3 ranking products",
      "Guaranteed high authority backlink",
      "Skip the queue",
      "10 dedicated weekly slots",
      "Priority support",
      "Premium badge & featured placement",
    ],
    limitations: [],
    popular: true,
    cta: "Choose Premium",
    ctaClass: "btn-primary",
  },
];

const features = [
  {
    icon: Plus,
    title: "High Authority Backlinks",
    description:
      "Get valuable backlinks from our DR22+ domain to boost your SEO ranking and organic traffic.",
  },
  {
    icon: Group,
    title: "Engaged Community",
    description:
      "Reach thousands of makers, entrepreneurs, and AI enthusiasts actively looking for new AI tools.",
  },
  {
    icon: BadgeCheck,
    title: "Competition System",
    description:
      "Compete in weekly contests for additional exposure and recognition badges.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description:
      "Our curated platform ensures your AI project reaches a quality audience interested in AI innovations.",
  },
];

const faqs = [
  {
    question:
      "What makes AI Launch Space different from other launch platforms?",
    answer:
      "We specifically focus on AI projects, providing a targeted audience of people interested in AI tools and innovations. Our weekly competition system gives you opportunities for exposure, and our DR22+ domain provides valuable SEO benefits.",
  },
  {
    question: "How do the guaranteed backlinks work?",
    answer:
      "Standard plan AI projects get nofollow backlinks by default, with the opportunity to earn dofollow links by winning top 3 in weekly competitions. Premium plan ($15) receives guaranteed dofollow backlinks immediately upon approval. Both plans can earn badges for top 3 ranking products regardless of the plan chosen.",
  },
  {
    question: "Can I change my plan after submitting?",
    answer:
      "Yes! You can upgrade your plan within 7 days of submission. Contact our support team and we'll help you upgrade and apply the additional benefits retroactively.",
  },
  {
    question: "What happens during the approval process?",
    answer:
      "We review all submissions to ensure quality and relevance. Standard submissions typically take 24-48 hours, while Premium submissions skip the queue and are processed within 2-4 hours.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 30-day money-back guarantee for Premium plans if you're not satisfied with the results. Since the Standard plan is free, no refunds are applicable.",
  },
  {
    question: "How long will my AI project stay featured?",
    answer:
      "Your AI project will appear on our homepage for 7 days, but it remains permanently searchable in our AI project database. Top 3 winners from weekly competitions receive badges and dofollow backlinks regardless of their chosen plan.",
  },
];

function PricingCard({ plan, index }) {
  return (
    <div
      className={`card bg-base-100 shadow-xl border transition-all hover:shadow-2xl ${
        plan.popular
          ? "border-primary border-2 transform scale-105"
          : "border-base-300"
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="badge badge-primary badge-lg px-4 py-3">
            <Star className="w-4 h-4 mr-1" />
            Most Popular
          </div>
        </div>
      )}

      <div className="card-body p-8">
        <div className="text-center mb-6">
          <div className="mb-4">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                plan.popular
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content"
              }`}
            >
              {React.createElement(plan.icon, { className: "w-8 h-8" })}
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

          <div className="mb-4">
            <span className="text-4xl font-bold">
              {plan.price === 0 ? "Free" : `$${plan.price}`}
            </span>
            {plan.price > 0 && (
              <span className="text-base-content/60 ml-2">one-time</span>
            )}
          </div>

          <p className="text-base-content/70">{plan.description}</p>
        </div>

        <div className="space-y-4 mb-8">
          <h4 className="font-semibold text-success flex items-center">
            <Check className="w-4 h-4 mr-2" />
            What's included:
          </h4>
          <ul className="space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <Check className="w-4 h-4 text-success mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {plan.limitations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-base-300">
              <h4 className="font-medium text-base-content/70 text-sm mb-3">
                Limitations:
              </h4>
              <ul className="space-y-2">
                {plan.limitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="w-2 h-2 bg-base-content/30 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-base-content/60">
                      {limitation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Link href="/submit" className="w-full">
          <button className={`btn w-full ${plan.ctaClass} btn-lg`}>
            {plan.cta}
          </button>
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-6 text-center">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            {React.createElement(feature.icon, {
              className: "w-6 h-6 text-primary",
            })}
          </div>
        </div>
        <h3 className="font-semibold mb-3">{feature.title}</h3>
        <p className="text-sm text-base-content/70">{feature.description}</p>
      </div>
    </div>
  );
}

function FAQItem({ faq, index }) {
  return (
    <div className="collapse collapse-plus bg-base-100 border border-base-300">
      <input type="radio" name="faq-accordion" defaultChecked={index === 0} />
      <div className="collapse-title text-lg font-medium">{faq.question}</div>
      <div className="collapse-content">
        <p className="text-base-content/70">{faq.answer}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-base-200/50 to-base-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            Choose the perfect plan to launch your AI project to thousands of
            engaged users. All plans include permanent listing and competition
            entry.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-base-200/30 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose AI Launch Space?
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              We provide more than just a listing - we offer a complete launch
              experience designed specifically for AI builders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-8">
            Trusted by AI Builders
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-base-content/70">AI Projects Launched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">DR22+</div>
              <div className="text-base-content/70">Domain Authority</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-base-content/70">Monthly Visitors</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-base-200/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-base-content/70">
              Everything you need to know about launching your AI project.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Launch Your AI Project?
          </h2>
          <p className="text-lg text-base-content/70 mb-8 max-w-2xl mx-auto">
            Join hundreds of AI builders who have successfully launched
            their projects and grown their audience with AI Launch Space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/submit" className="btn btn-primary btn-lg">
              <Flash className="w-5 h-5 mr-2" />
              Launch Your AI Project
            </Link>
            <Link href="/directories" className="btn btn-outline btn-lg">
              Browse Examples
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-base-200/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Need Help Choosing?</h3>
          <p className="text-base-content/70 mb-6">
            Our team is here to help you select the best plan for your
            AI project's goals.
          </p>
          <a href="mailto:hello@ailaunchspace.com" className="btn btn-outline">
            Contact Our Team
          </a>
        </div>
      </div>
    </div>
  );
}
