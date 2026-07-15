"use client";

import React from "react";
import { PromoBlockEditor } from "@/components/admin/PromoBlockEditor";
import { PanelFade } from "@/components/admin/advertising/placements-common";

/**
 * Hosts the Promo Block editor — the admin-configurable advertising banner +
 * popup. The editor keeps its own Save/Reset footer, so no header action button
 * is rendered for this tab.
 */
export function MarketingPanel() {
  return (
    <PanelFade>
      <PromoBlockEditor />
    </PanelFade>
  );
}
