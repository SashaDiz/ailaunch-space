"use client";

import { ThemeProvider } from "next-themes";
import { SupabaseProvider } from "./SupabaseProvider";
import { SiteThemeProvider, type SiteTheme } from "./SiteThemeProvider";
import { SiteTracker } from "./SiteTracker";
import { DemoModeProvider } from "./DemoModeProvider";
import { Toaster } from "react-hot-toast";

export function Providers({ children, initialTheme }: { children: React.ReactNode; initialTheme?: SiteTheme | null }) {
  return (
    <DemoModeProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        <SiteThemeProvider initialTheme={initialTheme}>
          <SiteTracker />
          {children}
        <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 9999,
          },
          success: {
            style: {
              background: "#10b981",
              color: "hsl(var(--background))",
              border: "1px solid #059669",
            },
          },
          error: {
            style: {
              background: "hsl(var(--destructive))",
              color: "hsl(var(--background))", 
              border: "1px solid hsl(var(--destructive))",
            },
          },
          loading: {
            style: {
              background: "hsl(var(--foreground))",
              color: "hsl(var(--background))",
              border: "1px solid hsl(var(--foreground))",
            },
          },
        }}
        containerStyle={{
          zIndex: 9999,
        }}
      />
        </SiteThemeProvider>
    </SupabaseProvider>
    </ThemeProvider>
    </DemoModeProvider>
  );
}