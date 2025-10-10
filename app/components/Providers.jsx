"use client";

import { SupabaseProvider } from "./SupabaseProvider";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
  return (
    <SupabaseProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 9999,
          },
          success: {
            style: {
              background: "#10b981",
              color: "#ffffff",
              border: "1px solid #059669",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#ffffff", 
              border: "1px solid #dc2626",
            },
          },
          loading: {
            style: {
              background: "#3b82f6",
              color: "#ffffff",
              border: "1px solid #2563eb",
            },
          },
        }}
        containerStyle={{
          zIndex: 9999,
        }}
      />
    </SupabaseProvider>
  );
}