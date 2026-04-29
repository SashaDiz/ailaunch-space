"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * ThemeSwitcher — Mode toggle only (Light/Dark/System).
 * Color theme is admin-controlled via the admin Theme page.
 */
export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-[var(--radius)] border border-border bg-background" />;
  }

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-[var(--radius)] border border-border bg-background text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle theme mode"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 rounded-[var(--radius)] border border-border bg-background z-50 p-2" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="flex gap-1">
            {([
              { value: "light", icon: Sun, label: "Light" },
              { value: "dark", icon: Moon, label: "Dark" },
              { value: "system", icon: Monitor, label: "System" },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors ${
                  theme === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
