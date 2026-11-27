"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Eye, Search, Triangle } from "lucide-react";

type ProjectHit = {
  name: string;
  slug: string;
  short_description?: string | null;
  logo_url?: string | null;
  upvotes?: number | null;
  views?: number | null;
  plan?: string | null;
};
type CategoryHit = { name: string; slug: string; count: number };
type Result = { mode: "leading" | "results"; projects: ProjectHit[]; categories: CategoryHit[] };

const numberFormat = new Intl.NumberFormat("en-US");

/** ⌘K on macOS, Ctrl+K elsewhere: label for the trigger button. */
export function useShortcutLabel() {
  const [label, setLabel] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setLabel("⌘K");
  }, []);
  return label;
}

/** Opens on ⌘K / Ctrl+K anywhere on the site. */
export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Reset and focus on every open; lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Debounced fetch; stale responses are dropped.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (res.ok) {
          setResult(await res.json());
          setActive(0);
        }
      } catch {
        // Aborted or offline: keep the previous results on screen.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 160 : 0);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const items = useMemo(() => [
    ...(result?.categories || []).map((c) => ({ kind: "category" as const, href: `/categories/${c.slug}`, category: c })),
    ...(result?.projects || []).map((p) => ({ kind: "project" as const, href: `/project/${p.slug}`, project: p })),
  ], [result]);

  const go = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (items[active]) go(items[active].href);
      else if (query.trim()) go(`/?q=${encodeURIComponent(query.trim())}#projects-section`);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  const categoryCount = result?.categories.length || 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search AI tools"
        className="relative w-full max-w-xl overflow-hidden rounded-[calc(var(--radius)*3)] border border-border bg-card"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI tools..."
            aria-label="Search AI tools"
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `search-item-${active}` : undefined}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd
            className="shrink-0 cursor-pointer rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            onClick={onClose}
          >
            esc
          </kbd>
        </div>

        <div ref={listRef} id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
          {categoryCount > 0 && (
            <p className="px-3 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Categories</p>
          )}
          {items.map((item, index) => {
            const selected = index === active;
            const base = `flex w-full items-center gap-3 rounded-[calc(var(--radius)*2)] px-3 py-2 text-left transition-colors ${selected ? "bg-muted" : "hover:bg-muted/60"}`;
            const header = index === categoryCount && (
              <p key="projects-label" className="px-3 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {result?.mode === "leading" ? "Leading this week" : "AI tools"}
              </p>
            );
            if (item.kind === "category") {
              return (
                <button key={item.href} id={`search-item-${index}`} data-index={index} role="option" aria-selected={selected}
                  className={base} onMouseMove={() => setActive(index)} onClick={() => go(item.href)}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[calc(var(--radius)*2)] border border-border text-xs font-semibold text-foreground">#</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{item.category.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{numberFormat.format(item.category.count)} tools</span>
                </button>
              );
            }
            const p = item.project;
            const upvotes = p.upvotes || 0;
            return (
              <React.Fragment key={item.href}>
                {header}
                <button id={`search-item-${index}`} data-index={index} role="option" aria-selected={selected}
                  className={base} onMouseMove={() => setActive(index)} onClick={() => go(item.href)}>
                  {p.logo_url ? (
                    <img src={p.logo_url} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-[calc(var(--radius)*2)] border border-border bg-background object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[calc(var(--radius)*2)] border border-border text-xs font-semibold text-foreground">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-foreground">{p.name}</span>
                    {p.short_description && <span className="block truncate text-[11px] text-muted-foreground">{p.short_description}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
                    {upvotes > 0 ? (
                      <><Triangle className="h-3 w-3 fill-current" aria-label="upvotes" /> {numberFormat.format(upvotes)}</>
                    ) : (
                      <><Eye className="h-3 w-3" aria-label="views" /> {numberFormat.format(p.views || 0)}</>
                    )}
                  </span>
                </button>
              </React.Fragment>
            );
          })}

          {!loading && result && items.length === 0 && (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nothing found for “{query}”. Press Enter to search the whole catalog.
            </div>
          )}
          {!result && <div className="px-3 py-10 text-center text-sm text-muted-foreground">Loading…</div>}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span>↑↓ to move · Enter to open · Esc to close</span>
          <span className="hidden sm:inline">Search across every AI tool on the site</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
