"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const FALLBACK_AVATARS = Array.from({ length: 6 }, (_, i) => ({
  id: `fallback-${i + 1}`,
  avatar_url: `/assets/avatars/avatar-${i + 1}.png`,
}));

export function SocialProof({ className = "" }) {
  const [data, setData] = useState({ total: 0, users: [] as { id: string; avatar_url: string }[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social-proof")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData({
            total: json.data.total ?? 0,
            users: json.data.users ?? [],
          });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const { total, users: realUsers } = data;
  const users = realUsers.length > 0 ? realUsers : FALLBACK_AVATARS;

  const formatRoundedNumber = (num) => {
    if (num < 100) {
      return `${num}+`;
    } else if (num < 1000) {
      return `${Math.floor(num / 100) * 100}+`;
    } else if (num < 10000) {
      return `${Math.floor(num / 1000) * 1000}+`;
    } else {
      const rounded = Math.floor(num / 1000) * 1000;
      return `${rounded.toLocaleString()}+`;
    }
  };

  const totalLabel = loading ? "—" : formatRoundedNumber(total);

  return (
    <section
      className={`${className}`}
      aria-labelledby="social-proof-heading"
    >
      {users.length > 0 && (
        <ul
          className="mb-3 flex flex-nowrap items-center justify-center"
          aria-hidden="true"
        >
          {users.map((user, index) => (
            <li
              key={user.id}
              className={`flex shrink-0 ${index > 0 ? "-ml-2.5" : ""}`}
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background sm:h-10 sm:w-10"
                style={{
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <Image
                  src={user.avatar_url}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  unoptimized
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2
        id="social-proof-heading"
        className="text-center text-[14px] font-medium text-muted-foreground"
      >
        Join <span className="font-bold text-foreground">{totalLabel}</span> builders to get discovered.
      </h2>
    </section>
  );
}
