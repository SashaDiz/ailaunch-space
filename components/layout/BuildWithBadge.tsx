"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function BuildWithBadge() {
  const pathname = usePathname() ?? "";
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (pathname.startsWith("/admin")) return null;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50 max-md:bottom-4 max-md:right-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover popup card */}
      <div
        className={`absolute bottom-full right-0 mb-3 w-72 overflow-hidden rounded-xl border bg-card shadow-xl transition-all duration-200 ${
          isHovered
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="relative h-36 w-full bg-muted">
          <Image
            src="/assets/directory-launch-preview.png"
            alt="DirectoryLaunch Preview"
            fill
            className="object-cover"
          />
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-foreground">
            Build your own directory
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Create a professional directory website in minutes with DirectoryLaunch — the ultimate SaaS boilerplate.
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
            Learn more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </p>
        </div>
      </div>

      {/* Floating badge */}
      <a
        href="https://directory-launch.com/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-full border border-white/10 p-1 pr-4 text-xs font-medium text-white shadow-lg leading-none transition-all duration-200 hover:shadow-xl hover:border-white/20"
        style={{ backgroundColor: "#090A0B" }}
      >
        <Image
          src="/assets/dk-logo.svg"
          alt="DirectoryLaunch"
          width={22}
          height={22}
        />
        Built with DirectoryLaunch
      </a>
    </div>
  );
}
