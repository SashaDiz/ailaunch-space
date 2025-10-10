"use client";

import React, { useState } from "react";

const faqs = [
  {
    question: "How does the AI project submission work?",
    answer:
      "Submit your AI project to our weekly competition platform. Once approved, it goes live on the homepage for 7 days where the community can vote for it. Top 3 projects win badges and high authority backlinks.",
  },
  {
    question: "How long does the submission process take?",
    answer:
      "Standard submissions are typically reviewed within 24-48 hours. Premium submissions get priority review and skip the queue.",
  },
  {
    question: "What information do you need from me?",
    answer:
      "We need your AI project name, URL, description, category, logo, contact information, and optionally screenshots and maker details.",
  },
  {
    question: "Do you guarantee a backlink for all submissions?",
    answer:
      "Premium submissions get a guaranteed dofollow backlink. Standard submissions compete for top 3 positions each week to earn badges and dofollow backlinks.",
  },
  {
    question: "Can I track the progress of my submissions?",
    answer:
      "Yes! You can track votes, views, and competition standings in real-time from your dashboard.",
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
          Get answers to common questions about our directory submission service
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
