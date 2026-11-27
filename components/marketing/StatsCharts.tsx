"use client";

import React from "react";
import {
  Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const numberFormat = new Intl.NumberFormat("en-US");

const axis = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 10,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--foreground))",
  fontSize: "11px",
  padding: "6px 10px",
};

/** Explicit text colours: recharts otherwise paints the value in the series colour, unreadable in dark mode. */
const tooltipText = {
  labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: "hsl(var(--muted-foreground))", padding: 0 },
};

const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const shortMonth = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

/** Five evenly spread date ticks, first and last always included. */
const ticksFor = (dates: string[], count = 5) =>
  dates.length <= count ? dates : Array.from({ length: count }, (_, i) => dates[Math.round((i * (dates.length - 1)) / (count - 1))]);

/** Mono label, a hairline rule, and an optional note or legend on the right. */
export function SectionLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80">{children}</h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
      {aside && <span className="shrink-0 text-[11px] text-muted-foreground">{aside}</span>}
    </div>
  );
}

export function ChartBlock({
  label, aside, height = 170, children,
}: { label: string; aside?: React.ReactNode; height?: number; children: React.ReactNode }) {
  return (
    <section>
      <SectionLabel aside={aside}>{label}</SectionLabel>
      <div className="mt-4" style={{ height }}>{children}</div>
    </section>
  );
}

/** Legend squares used in chart asides. */
export function Legend({ items }: { items: Array<{ label: string; faded?: boolean }> }) {
  return (
    <span className="inline-flex items-center gap-3">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 bg-primary" style={{ opacity: item.faded ? 0.35 : 1 }} />
          {item.label}
        </span>
      ))}
    </span>
  );
}

type Point = { date: string; partial?: boolean; [key: string]: unknown };

/** Dense daily bars, no grid; today's partial bar is faded. */
export function DailyBars({
  data, dataKey, name, extraKey, extraName,
}: { data: Point[]; dataKey: string; name: string; extraKey?: string; extraName?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 14, bottom: 0, left: 14 }} barCategoryGap={2}>
        <XAxis dataKey="date" {...axis} tickFormatter={shortDay} ticks={ticksFor(data.map((d) => d.date))} interval={0} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          contentStyle={tooltipStyle}
          {...tooltipText}
          labelFormatter={(label, payload) =>
            `${shortDay(String(label))}${payload?.[0]?.payload?.partial ? " · so far" : ""}`}
          formatter={(value: number, _key: string, item) => {
            const extra = extraKey ? item?.payload?.[extraKey] : undefined;
            return typeof extra === "number"
              ? [`${numberFormat.format(value)} · ${numberFormat.format(extra)} ${extraName}`, name]
              : [numberFormat.format(value), name];
          }}
        />
        <Bar dataKey={dataKey} name={name} radius={[1, 1, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.date} fill="hsl(var(--primary))" fillOpacity={d.partial ? 0.35 : 0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyBars({ data }: { data: Array<{ month: string; visits: number }> }) {
  const last = data[data.length - 1]?.month;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={6}>
        <XAxis dataKey="month" {...axis} tickFormatter={shortMonth} interval={0} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          contentStyle={tooltipStyle}
          {...tooltipText}
          labelFormatter={(label) => `${shortMonth(String(label))}${label === last ? " · so far" : ""}`}
          formatter={(value: number) => [numberFormat.format(value), "visits"]}
        />
        <Bar dataKey="visits" radius={[1, 1, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.month} fill="hsl(var(--primary))" fillOpacity={d.month === last ? 0.35 : 0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Running total as a filled area, the day's gain in the tooltip. */
export function CumulativeArea({ data, name }: { data: Point[]; name: string }) {
  const totals = data.map((d) => Number(d.total) || 0);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 14, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="statsCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" {...axis} tickFormatter={shortDay} ticks={ticksFor(data.map((d) => d.date))} interval={0} />
        <YAxis {...axis} width={34} domain={[min, max]} ticks={[min, max]} tickFormatter={(v) => numberFormat.format(v)} />
        <Tooltip
          contentStyle={tooltipStyle}
          {...tooltipText}
          labelFormatter={(label) => shortDay(String(label))}
          formatter={(value: number, _key, item) => [
            `${numberFormat.format(value)} (+${numberFormat.format(Number(item?.payload?.count) || 0)})`,
            name,
          ]}
        />
        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#statsCumulative)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
