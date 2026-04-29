"use client";

import React from "react";
import { ThemeEditor } from "@/components/admin/ThemeEditor";

export default function AdminThemePage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-2">Theme</h1>
      <p className="text-muted-foreground mb-6">
        Customize colors, typography, and other visual settings for the whole site. Changes apply to all visitors.
      </p>
      <ThemeEditor />
    </>
  );
}
