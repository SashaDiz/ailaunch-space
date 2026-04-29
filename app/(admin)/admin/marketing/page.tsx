"use client";

import React from "react";
import { AutoSubmitBannerEditor } from "@/components/admin/AutoSubmitBannerEditor";

export default function AdminMarketingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">Marketing</h1>
      <p className="text-muted-foreground mb-6">
        Manage promotional banners and marketing placements across the site.
      </p>
      <AutoSubmitBannerEditor />
    </>
  );
}
