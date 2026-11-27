"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { LaunchPlatformType } from "@/config/launch-platforms.config";

export type PlatformRow = {
  name: string;
  domain: string;
  url: string;
  type: LaunchPlatformType;
  typeLabel: string;
  note: string;
  /** null when Ahrefs did not answer: shown as "—", never as a made-up number. */
  dr: number | null;
};

const FILTERS: Array<{ key: "all" | LaunchPlatformType; label: string }> = [
  { key: "all", label: "All" },
  { key: "ai-directory", label: "AI directories" },
  { key: "launch-platform", label: "Launch platforms" },
  { key: "software-directory", label: "Software directories" },
  { key: "community", label: "Communities" },
];

export function LaunchPlatformsTable({ rows }: { rows: PlatformRow[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const visible = useMemo(() => rows.filter((r) => filter === "all" || r.type === filter), [rows, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <div>
      <div role="tablist" aria-label="Filter by type" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              filter === f.key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label} <span className="tabular-nums opacity-60">{counts[f.key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-[var(--radius)] border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th scope="col" className="w-10 px-4 py-2.5 font-semibold">#</th>
              <th scope="col" className="px-2 py-2.5 font-semibold">Platform</th>
              <th scope="col" className="hidden px-2 py-2.5 font-semibold md:table-cell">Type</th>
              <th scope="col" className="w-48 px-2 py-2.5 font-semibold">Domain Rating</th>
              <th scope="col" className="w-16 px-4 py-2.5"><span className="sr-only">Visit</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={row.domain + row.name} className="group border-b border-border/60 last:border-b-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 align-top text-[11px] tabular-nums text-muted-foreground">{index + 1}</td>
                <td className="px-2 py-3 align-top">
                  <div className="text-[13px] font-semibold text-foreground">{row.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.domain} <span className="hidden sm:inline">· {row.note}</span>
                  </div>
                </td>
                <td className="hidden px-2 py-3 align-top md:table-cell">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{row.typeLabel}</span>
                </td>
                <td className="px-2 py-3 align-top">
                  {row.dr === null ? (
                    <span className="text-[12px] text-muted-foreground">—</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-[13px] font-semibold tabular-nums text-foreground">{row.dr}</span>
                      <span aria-hidden className="h-1 flex-1 bg-muted">
                        <span className="block h-full bg-primary" style={{ width: `${row.dr}%` }} />
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    aria-label={`Visit ${row.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
