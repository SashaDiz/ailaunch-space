"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeEditor } from "@/components/admin/ThemeEditor";
import { DisplaySettingsEditor } from "@/components/admin/DisplaySettingsEditor";

export function DesignTabs({ sampleProject }: { sampleProject?: any }) {
  const [tab, setTab] = useState("layout");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="layout">Layout</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
      </TabsList>

      <TabsContent value="layout">
        <DisplaySettingsEditor sampleProject={sampleProject} />
      </TabsContent>

      <TabsContent value="theme">
        <ThemeEditor />
      </TabsContent>
    </Tabs>
  );
}
