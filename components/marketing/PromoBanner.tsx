"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export function PromoBanner({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const discountCode = "NY2026";
  const discountPercentage = "40";
  // January 14, 2026 at end of day (23:59:59 UTC)
  const endDate = new Date("2026-01-14T23:59:59Z");

  // Calculate time remaining until January 14
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = endDate.getTime() - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  // Update countdown every second
  useEffect(() => {
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format countdown for display
  const formatCountdown = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
      toast.success("Discount code copied to clipboard!", {
        icon: "🎉",
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code. Please try again.");
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
    // Store dismissal in localStorage to respect user preference
    if (typeof window !== "undefined") {
      localStorage.setItem("promo_banner_dismissed", "true");
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-background py-2.5 px-4 relative z-40 print:hidden">
      <div className="max-w-[1480px] mx-auto flex items-center justify-center gap-3 relative">
        {/* Left decoration */}
        <Sparkles className="hidden sm:block w-4 h-4 flex-shrink-0" strokeWidth={2} />
        
        {/* Content */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
          <span className="text-center">
            🎉 New Year Promo: <strong>{discountPercentage}% OFF</strong> Premium Launch <span className="font-semibold">(ends in: {formatCountdown()})</span> - Use code{" "}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 font-bold bg-card/20 hover:bg-card/30 px-2.5 py-1 rounded-md transition-all duration-200 hover:scale-105 border border-white/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
              aria-label={`Copy discount code ${discountCode} to clipboard`}
            >
              <span className="tracking-wider">{discountCode}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
              )}
            </button>
            {" "}at checkout
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-0 sm:relative sm:right-auto ml-2 p-1 hover:bg-background/20 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-500"
          aria-label="Close promo banner"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

