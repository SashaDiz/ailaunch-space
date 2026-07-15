"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Handshake, Megaphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SponsorsPanel } from "@/components/admin/advertising/SponsorsPanel";
import { PromotionsPanel } from "@/components/admin/advertising/PromotionsPanel";

const TABS = [
  { value: "sponsors", label: "Sponsors", icon: Handshake },
  { value: "promotions", label: "Promotions", icon: Megaphone },
] as const;

const VALID_TABS = new Set(TABS.map((t) => t.value));

function AdvertisingTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");

  // Local state keeps tab switches instant; the URL is synced as a side effect
  // so deep links (and the old /admin/sponsors|promotions|marketing redirects)
  // land on the right tab.
  const [tab, setTab] = useState(
    initial && VALID_TABS.has(initial as any) ? initial : "sponsors"
  );

  const handleChange = (value: string) => {
    setTab(value);
    router.replace(`/admin/advertising?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={handleChange}>
      <TabsList className="mb-6">
        {TABS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="gap-1.5">
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="sponsors">
        <SponsorsPanel active={tab === "sponsors"} />
      </TabsContent>
      <TabsContent value="promotions">
        <PromotionsPanel active={tab === "promotions"} />
      </TabsContent>
    </Tabs>
  );
}

export default function AdvertisingPage() {
  return (
    <Suspense fallback={null}>
      <AdvertisingTabs />
    </Suspense>
  );
}
