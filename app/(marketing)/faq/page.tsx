import React from "react";
import Link from "next/link";
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
  Link as LinkIcon,
  Crown,
  Star,
  ArrowUp,
  FileText,
  Mail,
} from "lucide-react";

// Plain-text FAQ data for JSON-LD schema (search engines can't parse JSX)
const faqSchemaData = [
  {
    question: `What is ${siteConfig.name} and how does it work?`,
    answer: `${siteConfig.name} is a ${siteConfig.tagline.toLowerCase()}. Submit your directory or project, get valuable backlinks, and compete for weekly recognition. Think Product Hunt but specifically for directories and tiny projects. Your submission goes live on the homepage for 7 days (14 days for Premium).`,
  },
  {
    question: "What information do you need for my submission?",
    answer: "We need: project name and website URL, short description (10-200 chars) and full description (50-3000 chars), category selection and logo URL, contact email. Optional: screenshots, video URL, maker details, and Twitter handle. All submissions go through a review process before going live.",
  },
  {
    question: "What are the different launch plans available?",
    answer: "Standard Launch (FREE): 15 shared weekly slots, 7 days on homepage, can earn dofollow backlinks by winning top 3. Premium Launch ($19): Guaranteed dofollow backlinks, extended 14-day homepage exposure, skips the queue, premium badge and priority placement, 10 dedicated slots beyond shared ones.",
  },
  {
    question: "What's the difference between Standard and Premium submissions?",
    answer: "Standard (FREE): 15 shared weekly slots, nofollow backlink by default, can earn dofollow plus badge if wins top 3, 7 days on homepage. Premium ($19): Guaranteed dofollow backlink by default, skips review queue, premium badge and priority placement, extended 14-day homepage exposure, 10 dedicated slots beyond shared ones.",
  },
  {
    question: "Can I upgrade my Standard (free) launch to Premium?",
    answer: "Yes! You can upgrade your Standard launch to Premium at any time from your dashboard. When you upgrade, your submission will receive guaranteed dofollow backlinks, premium badge and priority placement, and extended 14-day homepage exposure.",
  },
  {
    question: "How long does the submission review process take?",
    answer: "Standard Submissions are typically reviewed within 24-48 hours and enter the standard queue. Premium Submissions get priority review and skip the queue entirely. All submissions must be approved by our team before going live on the homepage.",
  },
  {
    question: "How does the draft system work for Premium submissions?",
    answer: "When you select Premium but don't complete payment, your submission is saved as a draft. Drafts don't count toward weekly slot limits until payment is confirmed. You can resume drafts from your dashboard, modify details, or even switch to Standard plan. If you resubmit with the same details, old drafts are automatically replaced.",
  },
  {
    question: "Can I edit my submission after it's submitted?",
    answer: "Draft Submissions: You can edit draft submissions (unpaid Premium) from your dashboard. Live Submissions: Once a submission is approved and goes live, you cannot edit it. However, you can contact us if you need to make critical updates to your live submission.",
  },
  {
    question: "What if I want to change from Premium to Standard plan?",
    answer: "If you have a Premium draft that hasn't been paid for, you can switch to Standard plan from your dashboard. This will convert your draft to a Standard submission, remove the payment requirement, and you'll then enter the standard review queue.",
  },
  {
    question: "Can I track my submission's performance?",
    answer: "Yes! You can track everything in real-time from your dashboard: views, competition standings, submission status (draft, pending, scheduled, live, etc.), and ranking position during the competition period.",
  },
];

const faqSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    questions: [
  {
    question: `What is ${siteConfig.name} and how does it work?`,
    answer:
          `${siteConfig.name} is a ${siteConfig.tagline.toLowerCase()}. Submit your directory or project, get valuable backlinks, and compete for weekly recognition. Think Product Hunt but specifically for directories and tiny projects. Your submission goes live on the homepage for 7 days (14 days for Premium).`,
      },
      {
        question: "What information do you need for my submission?",
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
        answer: (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-foreground" />
                <h4 className="font-semibold text-foreground">Standard Launch (FREE)</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground ml-7">
                <li>• 15 shared weekly slots</li>
                <li>• 7 days on homepage</li>
                <li>• Can earn dofollow backlinks by winning top 3</li>
              </ul>
            </div>
            <div className="bg-foreground rounded-xl p-4 border-2 border-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-background" />
                <h4 className="font-semibold text-background">Premium Launch ($19)</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-background ml-7">
                <li>• Guaranteed dofollow backlinks</li>
                <li>• Extended 14-day homepage exposure</li>
                <li>• Skips the queue</li>
                <li>• Premium badge and priority placement</li>
                <li>• 10 dedicated slots beyond shared ones</li>
              </ul>
            </div>
          </div>
        ),
  },
  {
    question: "What's the difference between Standard and Premium submissions?",
        answer: (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Standard (FREE)
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <span>15 shared weekly slots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <span>Nofollow backlink by default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <span>Can earn dofollow + badge if wins top 3 (place embed badge on your website required)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <span>7 days on homepage</span>
                  </li>
                </ul>
              </div>
              <div className="bg-foreground rounded-xl p-4 border-2 border-foreground">
                <h4 className="font-semibold text-background mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Premium ($19)
                </h4>
                <ul className="space-y-2 text-sm text-background">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-background mt-0.5 flex-shrink-0" />
                    <span>Guaranteed dofollow backlink by default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-background mt-0.5 flex-shrink-0" />
                    <span>Skips review queue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-background mt-0.5 flex-shrink-0" />
                    <span>Premium badge and priority placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-background mt-0.5 flex-shrink-0" />
                    <span>Extended 14-day homepage exposure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-background mt-0.5 flex-shrink-0" />
                    <span>10 dedicated slots beyond shared ones</span>
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-muted-foreground text-sm pt-2">
              Both plans can earn badges for top 3 ranking.
            </p>
          </div>
        ),
      },
      {
        question: "Can I upgrade my Standard (free) launch to Premium?",
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Yes! You can upgrade your Standard launch to Premium at any time from your dashboard. When you upgrade, your submission will receive:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowUp className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Guaranteed dofollow backlinks</span>
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
              The upgrade process allows you to select a future launch week and complete payment securely. Once upgraded, your submission gets all Premium benefits including the dofollow backlink.
            </p>
          </div>
        ),
  },
  {
    question: "How long does the submission review process take?",
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
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              When you select Premium but don't complete payment, your submission is saved as a draft.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Drafts don't count toward weekly slot limits until payment is confirmed</span>
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
        answer: (
          <div className="space-y-3">
            <p className="text-muted-foreground font-semibold">Yes! You can track everything in real-time from your dashboard:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Trophy className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Views</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Competition standings</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Submission status (draft, pending, scheduled, live, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <Crown className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Ranking position during the competition period</span>
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
];

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
