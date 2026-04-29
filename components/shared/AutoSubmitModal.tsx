"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Bot } from "lucide-react";
import { useAutoSubmitConfig } from "@/hooks/use-autosubmit-config";

export function AutoSubmitModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const { config } = useAutoSubmitConfig();

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

  if (!isOpen || !mounted || !config.enabled) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="relative bg-card rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl font-bold text-foreground pr-10"
            >
              {config.title}
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          {/* Description */}
          <p
            id="modal-description"
            className="text-base text-foreground mb-4 leading-relaxed pr-5"
          >
            {config.description}
          </p>

          {/* Learn More Link */}
          <div className="mb-6">
            <a
              href={config.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
            >
              {config.learnMoreText}
            </a>
          </div>

          {/* Benefits List */}
          {config.benefits.length > 0 && (
            <ul className="space-y-2 mb-8">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2
                    className="w-4 h-4 text-foreground mr-3 mt-0.5 flex-shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 items-center justify-center">
            <a
              href={config.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 min-h-[48px] uppercase"
              onClick={onClose}
            >
              <Bot className="w-4 h-4" strokeWidth={2} />
              {config.ctaText}
            </a>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground underline text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 min-h-[24px]"
            >
              {config.dismissText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
