"use client";

import React, { useState } from "react";

const faqs = [
  {
    question: "What is AI Launch Space and how does it work?",
    answer:
      "AI Launch Space is a weekly competition platform for AI projects. Submit your AI tool, get valuable backlinks, and compete for weekly recognition. Think Product Hunt but specifically for AI projects and tools. Your submission goes live on the homepage for 7 days where the community can vote for it.",
  },
  {
    question: "What are the different launch plans available?",
    answer:
      "We offer two plans: Standard Launch (FREE) and Premium Launch ($15). Standard gets 15 shared weekly slots, lives on homepage for 7 days, and can earn dofollow backlinks by winning top 3. Premium gets guaranteed dofollow backlinks, skips the queue, gets premium badge, and has 10 dedicated slots beyond the shared ones.",
  },
  {
    question: "How does the weekly competition system work?",
    answer:
      "Competitions automatically start every Monday at 00:00 PST and end the following Monday at 23:59:59 PST. All live submissions participate in voting. The top 3 submissions with the most votes automatically win dofollow backlinks and badges. Both Standard and Premium submissions can compete for these rewards.",
  },
  {
    question: "What's the difference between Standard and Premium submissions?",
    answer:
      "Standard (FREE): 15 shared weekly slots, nofollow backlink by default, can earn dofollow + badge if wins top 3. Premium ($15): Guaranteed dofollow backlink by default, skips review queue, premium badge, priority placement, and 10 dedicated slots beyond shared ones. Both plans can earn badges for top 3 ranking.",
  },
  {
    question: "How does the draft system work for Premium submissions?",
    answer:
      "When you select Premium but don't complete payment, your submission is saved as a draft. Drafts don't count toward weekly slot limits until payment is confirmed. You can resume drafts from your dashboard, modify details, or even switch to Standard plan. If you resubmit with the same details, old drafts are automatically replaced.",
  },
  {
    question: "What information do you need for my submission?",
    answer:
      "We need your AI project name, website URL, short description (10-200 chars), full description (50-3000 chars), category selection, logo URL, contact email, and optionally screenshots, video URL, maker details, and Twitter handle. All submissions go through a review process before going live.",
  },
  {
    question: "How long does the submission review process take?",
    answer:
      "Standard submissions are typically reviewed within 24-48 hours and enter the standard queue. Premium submissions get priority review and skip the queue entirely. All submissions must be approved by our team before going live on the homepage.",
  },
  {
    question: "Can I track my submission's performance?",
    answer:
      "Yes! You can track votes, views, and competition standings in real-time from your dashboard. You'll see your submission's current status (draft, pending, scheduled, live, etc.), vote count, and ranking position during the competition period.",
  },
  {
    question: "What happens if I don't win the weekly competition?",
    answer:
      "Standard submissions that don't win top 3 keep their nofollow backlink but remain in the projects listing permanently. Premium submissions always get their guaranteed dofollow backlink regardless of competition results. All submissions stay in the projects listing for future discovery even after the competition ends.",
  },
  {
    question: "How do I get my backlink and badge?",
    answer:
      "Winners are automatically awarded dofollow backlinks and badges when competitions end. You'll receive email notifications with instructions on how to add the badge to your website. The system automatically updates your submission's link type from nofollow to dofollow for winners.",
  },
  {
    question: "Can I edit my submission after it's submitted?",
    answer:
      "You can edit draft submissions (unpaid Premium) from your dashboard. Once a submission is approved and goes live, you cannot edit it. However, you can contact us if you need to make critical updates to your live submission.",
  },
  {
    question: "What if I want to change from Premium to Standard plan?",
    answer:
      "If you have a Premium draft that hasn't been paid for, you can switch to Standard plan from your dashboard. This will convert your draft to a Standard submission and remove the payment requirement. You'll then enter the standard review queue.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-base-content/70">
          Get answers to common questions about our AI project launch platform
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="collapse collapse-plus bg-base-200">
            <input
              type="radio"
              name="faq-accordion"
              checked={openIndex === index}
              onChange={() => toggleFAQ(index)}
              style={{ accentColor: '#ED0D79' }}
            />
            <div className="collapse-title text-xl font-medium">
              {faq.question}
            </div>
            <div className="collapse-content">
              <p className="text-base-content/70">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-base-content/70 mb-6">
          Contact us directly and we'll be happy to help
        </p>
        <a
          href="mailto:hello@ailaunchspace.com"
          className="btn btn-primary btn-lg"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
