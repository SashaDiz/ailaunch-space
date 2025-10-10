"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "../components/ProductCard";

// Inactive ProductCard wrapper for past launches
function InactiveProductCard({ directory }) {
  return <ProductCard directory={{...directory, userVoted: false}} onVote={() => {}} inactiveCta={true} />;
}

export default function PastLaunchesPage() {
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch directories from API
    const fetchDirectories = async () => {
      try {
        const response = await fetch("/api/directories?status=live&sort=createdAt");
        const result = await response.json();
        if (result.success) {
          setDirectories(result.data.directories || []);
        }
      } catch (error) {
        console.error("Error fetching directories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/70">Loading past launches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Past Launches</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Discover AI projects that have been successfully launched in previous weeks.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">Loading past launches...</p>
          </div>
        ) : directories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/70 mb-6">No past launches yet.</p>
            <Link href="/submit">
              <button className="btn btn-primary btn-lg">
                Be the First to Launch
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {directories.map((directory) => (
              <InactiveProductCard
                key={directory.id}
                directory={directory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
