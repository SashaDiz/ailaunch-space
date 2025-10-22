"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { OpenNewWindow, Plus, ThumbsUp, Crown } from "iconoir-react";
import toast from "react-hot-toast";
import { SocialShare } from "./SocialShare";
import { CategoryBadge, PricingBadge } from "./CategoryBadge";
import WinnerBadge from "./WinnerBadge";

// Helper function to generate AI project link with ref parameter and proper rel attribute
const generateProjectLink = (project) => {
  // Validate that website_url exists and is a valid URL
  if (!project.website_url || typeof project.website_url !== 'string') {
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }

  try {
    // Add ref parameter as per CLAUDE.md spec
    const url = new URL(project.website_url);
    url.searchParams.set('ref', 'ailaunchspace');
    
    // Use the link_type field from database
    // - "dofollow": Premium plans, weekly winners, or manually upgraded
    // - "nofollow": Standard (FREE) plans by default
    const isDofollow = project.link_type === "dofollow";
    
    return {
      url: url.toString(),
      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
    };
  } catch (error) {
    console.warn('Invalid URL for AI project:', project.name, project.website_url);
    return {
      url: '#',
      rel: "nofollow noopener noreferrer"
    };
  }
};

export function ProductCard({
  project,
  onVote,
  inactiveCta = false,
  viewMode = "auto",
  showStatusBadge = false,
}) {
  const [isVoting, setIsVoting] = useState(false);
  const [currentVotes, setCurrentVotes] = useState(project.upvotes);
  const [userVoted, setUserVoted] = useState(project.userVoted);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size for auto view mode
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Determine actual view mode
  const actualViewMode = viewMode === "auto" ? (isMobile ? "grid" : "list") : viewMode;

  // Generate AI project link data once for use in multiple places
  const projectLink = generateProjectLink(project);

  // Helper function to check if voting is allowed
  const isVotingAllowed = () => {
    // Check if CTA is inactive (for past launches)
    if (inactiveCta) return false;
    
    // Only "live" submissions can receive votes
    if (project.status !== "live") return false;
    
    // Use the canVote field from API (which already handles all competition logic)
    return project.canVote === true;
  };

  // Helper function to get the reason why voting is disabled
  const getVotingDisabledReason = () => {
    if (inactiveCta) {
      return "Voting is not available for past launches";
    }
    
    if (project.status === "scheduled") {
      return "Voting will be available when this project launches";
    }
    
    if (project.status === "pending") {
      return "This submission is under review";
    }
    
    if (project.status === "draft") {
      return "Draft submissions cannot receive votes";
    }
    
    if (project.status !== "live") {
      return `Only live submissions can receive votes`;
    }
    
    // Use statusBadge from API to determine the reason
    if (project.statusBadge === "scheduled") {
      return "Voting will be available when the launch week starts";
    }
    
    if (project.statusBadge === "past") {
      return "Voting period has ended for this launch";
    }
    
    if (!project.competitions || project.competitions.length === 0) {
      return "Not part of any launch week";
    }
    
    return "Voting is not currently available";
  };

  const handleVisitWebsite = async () => {
    // Track click analytics for AI project
    try {
      await fetch(`/api/projects/${project.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if voting is allowed
    if (!isVotingAllowed()) {
      toast.error(getVotingDisabledReason());
      return;
    }

    setIsVoting(true);
    try {
      const action = userVoted ? "remove" : "upvote";
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: project.id,
          action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentVotes(data.data.newVoteCount);
        setUserVoted(data.data.userVoted);
        toast.success(userVoted ? "Vote removed!" : "Vote added!");
        onVote?.(
          project.id,
          data.data.newVoteCount,
          data.data.userVoted
        );
      } else {
        const error = await response.json();
        if (error.code === "UNAUTHORIZED") {
          toast.error("Please sign in to vote");
        } else if (error.code === "INVALID_STATUS" || error.code === "NO_COMPETITION" || error.code === "COMPETITION_NOT_ACTIVE") {
          toast.error(error.message || error.error);
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
    window.location.href = `/project/${project.slug}`;
  };

  // Grid view layout
  if (actualViewMode === "grid") {
    return (
      <div className="block">
        <div
          className="w-full bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-[#ED0D79] hover:scale-[1.01]"
          onClick={handleCardClick}
        >
          {/* Top section: Logo with badges and Vote Button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] border rounded-lg border-base-300 overflow-hidden flex-shrink-0">
                <Image
                  src={project.logo_url}
                  alt={`${project.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover w-full h-full"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              
              {/* Badges next to logo */}
              <div className="flex flex-col space-y-1">
                {/* Winner Badge */}
                <WinnerBadge position={project.weekly_position} size="sm" />

                {/* Premium Badge */}
                {project.plan === "premium" && (
                  <span className="inline-flex leading-none items-center gap-1 px-1 py-0.5 text-[10px] sm:text-[11px] font-medium text-white rounded-sm" style={{backgroundColor: '#ED0D79'}}>
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={1.5} />
                    <span className="mt-0.5">Premium</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleVote}
              disabled={isVoting || !isVotingAllowed()}
              title={!isVotingAllowed() ? getVotingDisabledReason() : ""}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 sm:py-4 rounded-lg min-w-16 sm:min-w-20 text-sm sm:text-md font-semibold transition duration-300 ease-in-out
                          ${
                            !isVotingAllowed()
                              ? "bg-gray-400 text-white border-1 border-gray-300 pointer-events-none cursor-not-allowed opacity-60"
                              : userVoted
                              ? "bg-[#ED0D79] text-white translate-0"
                              : "bg-white text-black border border-gray-200 hover:border-[#ED0D79] hover:outline hover:outline-4 hover:outline-[#ed0d7912]"
                          }
                          ${
                            isVoting
                              ? "cursor-default"
                              : !isVotingAllowed()
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
            >
              <ThumbsUp
                width={20}
                height={20}
                strokeWidth={1.5}
                color={
                  !isVotingAllowed() ? "#ffffff" : userVoted ? "#ffffff" : "#000000"
                }
              />
              {isVoting ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
              ) : (
                <span className="text-sm sm:text-md leading-none font-semibold mt-0.5">{currentVotes}</span>
              )}
            </button>
          </div>

          {/* Title */}
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-base sm:text-lg font-semibold text-base-content line-clamp-1">
                {project.name}
              </h3>

              {/* Status Badge - Only show on private dashboard */}
              {showStatusBadge && project.statusBadge && (
                <span className={`badge badge-sm ${
                  project.statusBadge === "past" 
                    ? "badge-ghost" 
                    : project.statusBadge === "scheduled" 
                    ? "badge-warning" 
                    : "badge-success"
                }`}>
                  {project.statusBadge === "past" ? "Past" : 
                   project.statusBadge === "scheduled" ? "Scheduled" : 
                   "Live"}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-base-content/70 mb-3 line-clamp-2 sm:line-clamp-3">
            {project.short_description}
          </p>

          {/* Bottom: Categories and Visit button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {/* Pricing Badge */}
              {project.pricing && (
                <PricingBadge pricing={project.pricing} size="xs" />
              )}

              {/* Category Badges */}
              {project.categories.slice(0, 2).map((category) => (
                <CategoryBadge key={category} category={category} size="xs" />
              ))}
            </div>

            <a
              href={projectLink.url}
              target="_blank"
              rel={projectLink.rel}
              className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-1.5 sm:px-2 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-100 transition"
              onClick={(e) => {
                e.stopPropagation();
                handleVisitWebsite();
              }}
            >
              <OpenNewWindow className="w-3 h-3 sm:w-4 sm:h-4" />
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
        className="w-full bg-white rounded-2xl border border-gray-200 flex flex-row items-center p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-[#ED0D79] hover:scale-[1.01]"
        onClick={handleCardClick}
      >
        <div className="flex items-start space-x-3 flex-1">
          {/* Logo */}
          <div className="w-[96px] h-[96px] border rounded-lg border-base-300 overflow-hidden flex-shrink-0">
            <Image
              src={project.logo_url}
              alt={`${project.name} logo`}
              width={96}
              height={96}
              className="rounded-lg object-cover w-full h-full"
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-base-content">
                {project.name}
              </h3>

              {/* Badges next to title */}
              <div className="flex items-center space-x-1">
                {/* Winner Badge */}
                <WinnerBadge position={project.weekly_position} size="sm" />

                {/* Premium Badge */}
                {project.plan === "premium" && (
                  <span className="inline-flex leading-none items-center gap-1 px-1 py-0.5 text-[11px] font-medium text-white rounded-sm" style={{backgroundColor: '#ED0D79'}}>
                    <Crown className="w-4 h-4" strokeWidth={1.5} />
                    <span className="mt-0.5">Premium</span>
                  </span>
                )}
              </div>

              {/* Status Badge - Only show on private dashboard */}
              {showStatusBadge && project.statusBadge && (
                <span className={`badge badge-sm ${
                  project.statusBadge === "past" 
                    ? "badge-ghost" 
                    : project.statusBadge === "scheduled" 
                    ? "badge-warning" 
                    : "badge-success"
                }`}>
                  {project.statusBadge === "past" ? "Past" : 
                   project.statusBadge === "scheduled" ? "Scheduled" : 
                   "Live"}
                </span>
              )}
            </div>

            <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
              {project.short_description}
            </p>

            <div className="flex flex-wrap gap-1 mb-2">
              {/* Pricing Badge */}
              {project.pricing && (
                <PricingBadge pricing={project.pricing} size="xs" />
              )}

              {/* Category Badges */}
              {project.categories.slice(0, 3).map((category) => (
                <CategoryBadge key={category} category={category} size="xs" />
              ))}
            </div>
          </div>
        </div>

        {/* Vote Button */}
        <div className="flex flex-row items-center gap-4 ml-4">
          <a
            href={projectLink.url}
            target="_blank"
            rel={projectLink.rel}
            className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              handleVisitWebsite();
            }}
          >
            <OpenNewWindow className="w-4 h-4" />
          </a>
          <button
            onClick={handleVote}
            disabled={isVoting || !isVotingAllowed()}
            title={!isVotingAllowed() ? getVotingDisabledReason() : ""}
            className={`inline-flex items-center gap-1.5 px-3.5 py-4 rounded-lg min-w-20 text-md font-semibold transition duration-300 ease-in-out
                        ${
                          !isVotingAllowed()
                            ? "bg-gray-400 text-white pointer-events-none cursor-not-allowed opacity-60"
                            : userVoted
                            ? "bg-[#ED0D79] text-white translate-0"
                            : "bg-white text-black border border-gray-200 hover:border-[#ED0D79] hover:outline hover:outline-4 hover:outline-[#ed0d7912]"
                        }
                        ${
                          isVoting
                            ? "cursor-default"
                            : !isVotingAllowed()
                            ? "cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
          >
            <ThumbsUp
              width={24}
              height={24}
              strokeWidth={1.5}
              color={
                !isVotingAllowed() ? "#ffffff" : userVoted ? "#ffffff" : "#000000"
              }
            />
            {isVoting ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
            ) : (
              <span className="text-md leading-none font-semibold mt-0.5">{currentVotes}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
