"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Xmark, Heart, NavArrowRight } from "iconoir-react";
import { useRouter } from "next/navigation";

export function VoteRequiredModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

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

  const handleViewProjects = () => {
    onClose();
    // Scroll to projects section
    // Use setTimeout to ensure modal closes before scrolling
    setTimeout(() => {
      const projectsSection = document.getElementById('projects-section');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If not on homepage, navigate to it
        if (window.location.pathname !== '/') {
          router.push('/#projects-section');
        } else {
          // Already on homepage, try scrolling after a short delay
          setTimeout(() => {
            const section = document.getElementById('projects-section');
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      }
    }, 150);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-modal-title"
      aria-describedby="vote-modal-description"
    >
      <div
        className="relative bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <Heart className="w-6 h-6 text-gray-900" strokeWidth={2} />
              </div>
              <h2
                id="vote-modal-title"
                className="text-xl sm:text-2xl font-bold text-gray-900 pr-10"
              >
                Join the Community
              </h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              aria-label="Close modal"
            >
              <Xmark className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p
              id="vote-modal-description"
              className="text-base text-gray-900 mb-4 leading-relaxed"
            >
              Our platform is built around projects competing and supporting each other. To maintain this collaborative spirit, we ask that you vote for at least one project each day before submitting your own.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              This helps create a fair environment where everyone gets the recognition they deserve. Once you've voted for a project today, you'll be able to submit your own!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleViewProjects}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 min-h-[48px] uppercase"
            >
              <Heart className="w-4 h-4" strokeWidth={2} />
              View Projects & Vote
              <NavArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 underline text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 min-h-[24px]"
            >
              I'll vote later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
