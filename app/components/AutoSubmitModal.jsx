"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Xmark, CheckCircle, Send } from "iconoir-react";

export const AUTO_SUBMIT_CHECKOUT_URL =
  "https://buy.stripe.com/5kA8zCfZc9SeafC7ss";

export function AutoSubmitModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  // Handle mounting for SSR compatibility
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, mounted]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const benefits = [
    "Save 60+ hours of manual work",
    "Boost Domain Rating (DR +15 guaranteed)",
    "Get up to 20% of traffic from directories",
    "Manual, human-paced submissions (99.9% safe)",
    "Backlinks from a 10,000+ directory database",
    "Detailed report with full listing ownership",
    "Delivered in 1 month with weekly updates",
    "Long-term SEO gains and higher rankings",
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl font-bold text-gray-900 pr-10"
            >
              Boost Your DR by 15+
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              aria-label="Close modal"
            >
              <Xmark className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          {/* Description */}
          <p
            id="modal-description"
            className="text-base text-gray-900 mb-4 leading-relaxed pr-5"
          >
            Submit to 100+ hand-picked directories in one click with ListingBott - #1 directory submission service.
          </p>
          
          {/* Learn More Link */}
          <div className="mb-6">
            <a
              href="https://listingbott.com/?ref=directoryhunt.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-black underline inline-flex items-center gap-1"
            >
              Learn more about ListingBott
            </a>
          </div>

          {/* Benefits List */}
          <ul className="space-y-2 mb-8">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle
                  className="w-4 h-4 text-black mr-3 mt-0.5 flex-shrink-0"
                  strokeWidth={2}
                />
                <span className="text-sm text-gray-900">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 items-center justify-center">
            <a
              href={AUTO_SUBMIT_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 min-h-[48px] uppercase"
              onClick={onClose}
            >
              <Send className="w-4 h-4" strokeWidth={2} />
              Submit with ListingBott ($499)
            </a>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 underline text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 min-h-[24px]"
            >
              No, I'll do it myself.
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
