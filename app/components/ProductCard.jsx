"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OpenNewWindow, Plus } from "iconoir-react";
import toast from "react-hot-toast";
import { SocialShare } from "./SocialShare";
import { CategoryBadge, PricingBadge } from "./CategoryBadge";

// Helper function to generate directory link with ref parameter and proper rel attribute
const generateDirectoryLink = (directory) => {
  // Validate that website_url exists and is a valid URL
  if (!directory.website_url || typeof directory.website_url !== 'string') {
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }

  try {
    // Add ref parameter as per CLAUDE.md spec
    const url = new URL(directory.website_url);
    url.searchParams.set('ref', 'ailaunchspace');
    
    // Use the link_type field from database
    // - "dofollow": Premium plans, weekly winners, or manually upgraded
    // - "nofollow": Standard (FREE) plans by default
    const isDofollow = directory.link_type === "dofollow";
    
    return {
      url: url.toString(),
      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
    };
  } catch (error) {
    console.warn('Invalid URL for directory:', directory.name, directory.website_url);
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }
};

export function ProductCard({
  directory,
  onVote,
  inactiveCta = false,
  viewMode = "list",
}) {
  const [isVoting, setIsVoting] = useState(false);
  const [currentVotes, setCurrentVotes] = useState(directory.upvotes);
  const [userVoted, setUserVoted] = useState(directory.userVoted);

  // Generate directory link data once for use in multiple places
  const directoryLink = generateDirectoryLink(directory);

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Don't allow voting if CTA is inactive
    if (inactiveCta) {
      toast.error("Voting is not available for past launches");
      return;
    }

    setIsVoting(true);
    try {
      const action = userVoted ? "remove" : "upvote";
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: directory.id,
          action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentVotes(data.data.newVoteCount);
        setUserVoted(data.data.userVoted);
        toast.success(userVoted ? "Vote removed!" : "Vote added!");
        onVote?.(
          directory.id,
          data.data.newVoteCount,
          data.data.userVoted
        );
      } else {
        const error = await response.json();
        if (error.code === "UNAUTHORIZED") {
          toast.error("Please sign in to vote");
        } else {
          toast.error(error.message || "Failed to vote");
        }
      }
    } catch (error) {
      toast.error("Failed to vote. Please try again.");
    }
    setIsVoting(false);
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on interactive elements
    if (e.target.closest("button") || e.target.closest('a[href^="http"]')) {
      return;
    }
    window.location.href = `/directory/${directory.slug}`;
  };

  // Grid view layout
  if (viewMode === "grid") {
    return (
      <div className="block">
        <div
          className="w-full bg-white rounded-2xl border border-gray-200 p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5"
          onClick={handleCardClick}
        >
          {/* Top section: Logo and Vote Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="w-[64px] h-[64px] border rounded-2xl border-base-300 overflow-hidden flex-shrink-0">
              <Image
                src={directory.logo_url}
                alt={`${directory.name} logo`}
                width={64}
                height={64}
                className="rounded-2xl object-cover w-full h-full"
                style={{ width: "auto", height: "auto" }}
              />
            </div>

            <button
              onClick={handleVote}
              disabled={isVoting || inactiveCta}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl min-w-16 text-sm font-semibold transition duration-300 ease-in-out -translate-y-0.5
                          ${
                            inactiveCta
                              ? "bg-gray-200 text-gray-500 border-2 border-gray-300 cursor-not-allowed opacity-60"
                              : userVoted
                              ? "bg-black text-white translate-0"
                              : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-black hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                          }
                          ${
                            isVoting
                              ? "cursor-default"
                              : inactiveCta
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
            >
              <svg
                width="20px"
                height="20px"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color={
                  inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
                }
              >
                <path
                  d="M16.4724 20H4.1C3.76863 20 3.5 19.7314 3.5 19.4V9.6C3.5 9.26863 3.76863 9 4.1 9H6.86762C7.57015 9 8.22116 8.6314 8.5826 8.02899L11.293 3.51161C11.8779 2.53688 13.2554 2.44422 13.9655 3.33186C14.3002 3.75025 14.4081 4.30635 14.2541 4.81956L13.2317 8.22759C13.1162 8.61256 13.4045 9 13.8064 9H18.3815C19.7002 9 20.658 10.254 20.311 11.5262L18.4019 18.5262C18.1646 19.3964 17.3743 20 16.4724 20Z"
                  stroke={
                    inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
                  }
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M7 20L7 9"
                  stroke={
                    inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
                  }
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isVoting ? (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
              ) : (
                <span className="text-xs font-semibold">{currentVotes}</span>
              )}
            </button>
          </div>

          {/* Title and badges */}
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-base-content">
                {directory.name}
              </h3>

              {/* Winner Badges */}
              {directory.weekly_position === 1 && (
                <span className="badge bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-500 badge-sm font-bold">
                  🥇 1st Weekly
                </span>
              )}
              {directory.weekly_position === 2 && (
                <span className="badge bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 border-gray-400 badge-sm font-bold">
                  🥈 2nd Weekly
                </span>
              )}
              {directory.weekly_position === 3 && (
                <span className="badge bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900 border-orange-500 badge-sm font-bold">
                  🥉 3rd Weekly
                </span>
              )}

              {directory.plan === "premium" && (
                <span className="badge badge-primary badge-sm">Premium</span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
            {directory.short_description}
          </p>

          {/* Bottom: Categories and Visit button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {/* Pricing Badge */}
              {directory.pricing && (
                <PricingBadge pricing={directory.pricing} size="xs" />
              )}

              {/* Category Badges */}
              {directory.categories.slice(0, 2).map((category) => (
                <CategoryBadge key={category} category={category} size="xs" />
              ))}
            </div>

            <a
              href={directoryLink.url}
              target="_blank"
              rel={directoryLink.rel}
              className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <OpenNewWindow className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // List view layout (default/existing)
  return (
    <div className="block mb-4">
      <div
        className="w-full bg-white rounded-2xl border border-gray-200 flex flex-row items-center p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5"
        onClick={handleCardClick}
      >
        <div className="flex items-start space-x-3 flex-1">
          {/* Logo */}
          <div className="w-[96px] h-[96px] border rounded-2xl border-base-300 overflow-hidden">
            <Image
              src={directory.logo_url}
              alt={`${directory.name} logo`}
              width={96}
              height={96}
              className="rounded-2xl object-cover w-full h-full"
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-base-content">
                {directory.name}
              </h3>

              {/* Winner Badges */}
              {directory.weekly_position === 1 && (
                <span className="badge bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-500 badge-sm font-bold">
                  🥇 1st Weekly
                </span>
              )}
              {directory.weekly_position === 2 && (
                <span className="badge bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 border-gray-400 badge-sm font-bold">
                  🥈 2nd Weekly
                </span>
              )}
              {directory.weekly_position === 3 && (
                <span className="badge bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900 border-orange-500 badge-sm font-bold">
                  🥉 3rd Weekly
                </span>
              )}

              {directory.plan === "premium" && (
                <span className="badge badge-primary badge-sm">Premium</span>
              )}
            </div>

            <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
              {directory.short_description}
            </p>

            <div className="flex flex-wrap gap-1 mb-2">
              {/* Pricing Badge */}
              {directory.pricing && (
                <PricingBadge pricing={directory.pricing} size="xs" />
              )}

              {/* Category Badges */}
              {directory.categories.slice(0, 3).map((category) => (
                <CategoryBadge key={category} category={category} size="xs" />
              ))}
            </div>
          </div>
        </div>

        {/* Vote Button */}
        <div className="flex flex-row items-center gap-4 ml-4">
          <a
            href={directoryLink.url}
            target="_blank"
            rel={directoryLink.rel}
            className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <OpenNewWindow className="w-4 h-4" />
          </a>
          <button
            onClick={handleVote}
            disabled={isVoting || inactiveCta}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl min-w-20 text-md font-semibold transition duration-300 ease-in-out -translate-y-0.5
                        ${
                          inactiveCta
                            ? "bg-gray-200 text-gray-500 border-2 border-gray-300 cursor-not-allowed opacity-60"
                            : userVoted
                            ? "bg-black text-white translate-0"
                            : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-black hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                        }
                        ${
                          isVoting
                            ? "cursor-default"
                            : inactiveCta
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
          >
            <svg
              width="24px"
              height="24px"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              color={
                inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
              }
            >
              <path
                d="M16.4724 20H4.1C3.76863 20 3.5 19.7314 3.5 19.4V9.6C3.5 9.26863 3.76863 9 4.1 9H6.86762C7.57015 9 8.22116 8.6314 8.5826 8.02899L11.293 3.51161C11.8779 2.53688 13.2554 2.44422 13.9655 3.33186C14.3002 3.75025 14.4081 4.30635 14.2541 4.81956L13.2317 8.22759C13.1162 8.61256 13.4045 9 13.8064 9H18.3815C19.7002 9 20.658 10.254 20.311 11.5262L18.4019 18.5262C18.1646 19.3964 17.3743 20 16.4724 20Z"
                stroke={
                  inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
              ></path>
              <path
                d="M7 20L7 9"
                stroke={
                  inactiveCta ? "#9CA3AF" : userVoted ? "#ffffff" : "#000000"
                }
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            {isVoting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
            ) : (
              <span className="text-sm font-semibold">{currentVotes}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
