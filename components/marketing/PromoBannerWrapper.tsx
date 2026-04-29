"use client";

import React, { useState, useEffect } from "react";
import { PromoBanner } from "./PromoBanner";

export function PromoBannerWrapper() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("promo_banner_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return <PromoBanner onClose={() => setShowBanner(false)} />;
}

