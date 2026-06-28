"use client";

import React from "react";
import { AutoSubmitBannerEditor } from "@/components/admin/AutoSubmitBannerEditor";
import { PanelFade } from "@/components/admin/advertising/placements-common";

/**
 * The site-banner editor manages the auto-submit upsell banner and keeps its
 * own Save/Reset footer, so no header action button is rendered for this tab.
 */
export function MarketingPanel() {
  return (
    <PanelFade>
      <AutoSubmitBannerEditor />
    </PanelFade>
  );
}
