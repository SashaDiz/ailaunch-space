import React from "react";
import { siteConfig } from "@/config/site.config";
import { generateStructuredData } from "@/lib/seo";
import {
  Rocket,
  DollarSign,
  Trophy,
  Settings,
  HelpCircle,
  CheckCircle2,
  Clock,
  Crown,
  Star,
  ArrowUp,
  FileText,
  Mail,
} from "lucide-react";

// Single source of truth for the FAQ. Each question carries a rich JSX `answer`
// for display and a plain-text `schemaAnswer` for the JSON-LD schema (search
// engines can't parse JSX). When `answer` is already a string, it doubles as
// the schema answer.
const faqSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    questions: [
      {
        question: `What is ${siteConfig.name} and how does it work?`,
        answer: `${siteConfig.name} is a ${siteConfig.tagline.toLowerCase()}. Submit your project, get listed with a link back to your site, and reach makers browsing the directory. Two ways in: install our badge on your site for a free listing, or pay once for a featured placement at the top.`,
      },
      {
        question: "What information do you need for my submission?",
        schemaAnswer:
          "We need: project name and website URL, short description (10-200 chars) and full description (50-3000 chars), category selection and logo URL, and contact email. Optional: screenshots, video URL, maker details, and Twitter handle. All submissions go through admin review before going live.",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">We need the following information:</p>
            <ul className="space-y-2 list-none">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Project name and website URL</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Short description (10-200 chars) and full description (50-3000 chars)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Category selection and logo URL</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Contact email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Optional: screenshots, video URL, maker details, and Twitter handle</span>
              </li>
            </ul>
            <p className="text-muted-foreground pt-2">All submissions go through a review process before going live.</p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Launch Plans & Pricing",
    icon: DollarSign,
    questions: [
      {
        question: "What are the different launch plans available?",
        schemaAnswer:
          "Standard Launch (FREE): 15 shared slots, 7 days on the homepage, and a free listing with a link back to your site in exchange for installing our badge (we verify, admin approves). Premium Launch ($4.99, one-time): featured placement with a link back to your site, extended 14-day homepage exposure, priority review that skips the queue, a premium badge, and 10 dedicated slots. Standard projects must keep our badge embedded to retain their listing.",
        answer: (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-foreground" />
                <h4 className="font-semibold text-foreground">Standard Launch (FREE)</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground ml-7">
                <li>• 15 shared launch slots</li>
                <li>• 7 days on homepage</li>
                <li>• Free listing with a link back to your site in exchange for installing our badge (we verify, admin approves)</li>
                <li>• Submit button stays disabled until your badge passes verification</li>
              </ul>
            </div>
            <div className="bg-foreground rounded-xl p-4 border-2 border-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-background" />
                <h4 className="font-semibold text-background">Premium Launch ($4.99)</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-background ml-7">
                <li>• Featured placement with a link back to your site — no badge required</li>
                <li>• Extended 14-day homepage exposure</li>
                <li>• Priority review that skips the queue</li>
                <li>• Premium badge and priority placement</li>
                <li>• 10 dedicated slots beyond shared ones</li>
              </ul>
            </div>
            <p className="text-muted-foreground text-sm pt-2">
              Standard projects must keep our badge embedded on their site to retain their listing — we re-verify periodically.
            </p>
          </div>
        ),
      },
      {
        question: "Can I upgrade my Standard (free) launch to Premium?",
        schemaAnswer:
          "Yes — you can upgrade from your dashboard at any time. Upgrading removes the badge requirement and adds featured placement with a link back to your site, a premium badge, priority placement, and extended 14-day homepage exposure.",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Yes! You can upgrade your Standard launch to Premium at any time from your dashboard. When you upgrade, your submission will receive:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowUp className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Featured placement with a link back to your site</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Premium badge and priority placement</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Extended 14-day homepage exposure</span>
              </li>
            </ul>
            <p className="text-muted-foreground pt-2">
              The upgrade process allows you to select a future launch week and complete payment securely. Once upgraded, your submission gets all Premium benefits including featured placement.
            </p>
          </div>
        ),
      },
      {
        question: "How long does the submission review process take?",
        schemaAnswer:
          "Standard submissions are typically reviewed within 24-48 hours and enter the standard queue. Premium submissions get priority review and skip the queue. All submissions must be approved by our team before going live.",
        answer: (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-muted rounded-xl p-4 border border-border">
              <Clock className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground mb-1">Standard Submissions</p>
                <p className="text-muted-foreground text-sm">Typically reviewed within 24-48 hours and enter the standard queue.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-foreground rounded-xl p-4 border-2 border-foreground">
              <Crown className="w-5 h-5 text-background mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-background mb-1">Premium Submissions</p>
                <p className="text-background text-sm">Get priority review and skip the queue entirely.</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm pt-2">
              All submissions must be approved by our team before going live on the homepage.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    title: "Managing Your Submission",
    icon: Settings,
    questions: [
      {
        question: "How does the draft system work for Premium submissions?",
        schemaAnswer:
          "When you select Premium but don't complete payment, your submission is saved as a draft. Drafts don't count toward your launch slot limits until payment is confirmed. You can resume drafts from your dashboard, modify details, or switch to Standard plan. If you resubmit with the same details, old drafts are automatically replaced.",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              When you select Premium but don't complete payment, your submission is saved as a draft.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Drafts don't count toward your launch slot limits until payment is confirmed</span>
              </li>
              <li className="flex items-start gap-2">
                <Settings className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">You can resume drafts from your dashboard, modify details, or even switch to Standard plan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">If you resubmit with the same details, old drafts are automatically replaced</span>
              </li>
            </ul>
          </div>
        ),
      },
      {
        question: "Can I edit my submission after it's submitted?",
        schemaAnswer:
          "You can edit draft submissions (unpaid Premium) from your dashboard. Once a submission is approved and goes live you cannot edit it, but you can contact us if you need to make critical updates.",
        answer: (
          <div className="space-y-3">
            <div className="bg-muted rounded-xl p-4 border border-border">
              <p className="font-semibold text-foreground mb-2">Draft Submissions</p>
              <p className="text-muted-foreground text-sm">
                You can edit draft submissions (unpaid Premium) from your dashboard.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="font-semibold text-foreground mb-2">Live Submissions</p>
              <p className="text-muted-foreground text-sm">
                Once a submission is approved and goes live, you cannot edit it. However, you can contact us if you need to make critical updates to your live submission.
              </p>
            </div>
          </div>
        ),
      },
      {
        question: "What if I want to change from Premium to Standard plan?",
        schemaAnswer:
          "If you have a Premium draft that hasn't been paid for, you can switch to Standard plan from your dashboard. This converts your draft to a Standard submission, removes the payment requirement, and enters you into the standard review queue.",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              If you have a Premium draft that hasn't been paid for, you can switch to Standard plan from your dashboard.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowUp className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">This will convert your draft to a Standard submission</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Removes the payment requirement</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">You'll then enter the standard review queue</span>
              </li>
            </ul>
          </div>
        ),
      },
      {
        question: "Can I track my submission's performance?",
        schemaAnswer:
          "Yes! You can track everything in real-time from your dashboard: views, submission status (draft, pending, scheduled, live, etc.), and engagement on your listing.",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground font-semibold">Yes! You can track everything in real-time from your dashboard:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Views</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Submission status (draft, pending, scheduled, live, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Engagement on your listing</span>
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
];

// JSON-LD schema data, derived from the single source of truth above so the two
// never drift apart.
const faqSchemaData = faqSections.flatMap((section) =>
  section.questions.map((faq) => ({
    question: faq.question,
    answer: faq.schemaAnswer ?? (typeof faq.answer === "string" ? faq.answer : ""),
  }))
);

export function generateMetadata() {
  return {
    title: `FAQ - ${siteConfig.name}`,
    description: `Frequently asked questions about ${siteConfig.name}. Learn about submission plans, pricing, review process, and how to get the most from your project listing.`,
    alternates: {
      canonical: `${siteConfig.url}/faq`,
    },
    openGraph: {
      title: `FAQ - ${siteConfig.name}`,
      description: `Frequently asked questions about ${siteConfig.name}. Learn about submission plans, pricing, and the review process.`,
      type: "website",
    },
  };
}

export default function FAQPage() {
  // FAQPage JSON-LD schema
  const faqStructuredData = generateStructuredData("FAQPage", {
    faqs: faqSchemaData,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground/10 rounded-2xl mb-6">
          <HelpCircle className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get answers to common questions about our project launch platform
        </p>
      </div>

      <div className="space-y-12">
        {faqSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          return (
            <section key={sectionIndex} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-foreground/10 rounded-xl flex items-center justify-center">
                  <SectionIcon className="w-6 h-6 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-6">
                {section.questions.map((faq, faqIndex) => (
                  <div
                    key={faqIndex}
                    className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:border-foreground transition-all duration-300"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                      <span>{faq.question}</span>
                    </h3>
                    <div className="text-base text-muted-foreground leading-relaxed">
                      {typeof faq.answer === "string" ? (
                        <p>{faq.answer}</p>
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-12 border-t border-border">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground/10 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Contact us directly and we'll be happy to help
          </p>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
