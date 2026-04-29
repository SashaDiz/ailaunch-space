"use client";

import React from "react";
import Link from "next/link";

export function CategoryBadge({ category, clickable = true, size = "xs" }) {
  if (!category || typeof category !== 'string') {
    return null;
  }

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs"
  };
  const classes = `inline-flex items-center leading-none font-normal rounded-[var(--radius)] bg-muted text-foreground hover:bg-muted/80 transition-colors ${sizeClasses[size] ?? sizeClasses.sm}`;

  if (!clickable) {
    return <span className={classes}>{category}</span>;
  }

  return (
    <Link
      href={`/categories/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {category}
    </Link>
  );
}

export function PricingBadge({ pricing, clickable = true, size = "xs" }) {
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-xs"
  };
  const classes = `inline-flex items-center leading-none font-normal rounded-[var(--radius)] bg-muted text-foreground hover:bg-muted/80 transition-colors ${sizeClasses[size] ?? sizeClasses.sm}`;

  if (!clickable) {
    return <span className={classes}>{pricing || "Free"}</span>;
  }

  const value = (pricing || "free").toLowerCase();
  const filterValue = value.includes("freemium") ? "freemium" : value.includes("free") ? "free" : "paid";

  return (
    <Link
      href={`/?pricing=${filterValue}#projects-section`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {pricing || "Free"}
    </Link>
  );
}
