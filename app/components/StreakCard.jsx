"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { InfoCircle, NavArrowRight, Trophy, Spark, GraphUp, LogIn, Gift } from "iconoir-react";
import { useUser } from "../hooks/useUser";

// Custom Star Icon Component
const StarIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    width="18px"
    height="18px"
    viewBox="0 0 18 18"
    className={className}
    {...props}
  >
    <path
      d="M9 1.75L11.24 6.289L16.25 7.017L12.625 10.551L13.481 15.54L9 13.185L4.519 15.54L5.375 10.551L1.75 7.017L6.76 6.289L9 1.75Z"
      fill="currentColor"
      fillOpacity="0.3"
    />
    <path
      d="M9 1.75L11.24 6.289L16.25 7.017L12.625 10.551L13.481 15.54L9 13.185L4.519 15.54L5.375 10.551L1.75 7.017L6.76 6.289L9 1.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export function StreakCard() {
  const { user, loading: userLoading } = useUser();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchStreakData = useCallback(async () => {
    try {
      const response = await fetch("/api/streaks");
      if (response.ok) {
        const data = await response.json();
        setStreakData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchStreakData();
    } else if (!userLoading && !user?.id) {
      setLoading(false);
    }
  }, [user?.id, userLoading, fetchStreakData]);

  // Listen for vote events to refresh streak data
  useEffect(() => {
    const handleVoteSuccess = () => {
      // Refresh streak data when a vote is successful
      if (user?.id) {
        fetchStreakData();
      }
    };

    // Listen for custom vote success event
    window.addEventListener('voteSuccess', handleVoteSuccess);

    return () => {
      window.removeEventListener('voteSuccess', handleVoteSuccess);
    };
  }, [user?.id, fetchStreakData]);

  // Show loading state
  if (userLoading || (user?.id && loading)) {
    return null;
  }

  // Show motivational content for unauthenticated users
  if (!user?.id) {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 bg-white hover:border-gray-300 transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              Start Your Streak
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Unlock rewards by voting daily</p>
          </div>
          <div className="relative">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600">
              <Spark className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Motivational content */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-black flex-shrink-0">
              <Trophy className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Earn Exclusive Rewards</p>
              <p className="text-xs text-gray-600">
                Unlock discounts and free premium subscriptions as you build your voting streak
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-black flex-shrink-0">
              <GraphUp className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Climb the Leaderboard</p>
              <p className="text-xs text-gray-600">
                Compete with other users and see your name on the top of the leaderboard
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-black flex-shrink-0">
              <Gift className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Never Expires</p>
              <p className="text-xs text-gray-600">
                Your streak is cumulative and never resets—every vote counts toward your total
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white rounded-lg font-semibold text-sm hover:bg-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black group/button"
        >
          <LogIn className="h-4 w-4 group-hover/button:translate-x-0.5 transition-transform" aria-hidden="true" />
          <span>Sign In to Start Your Streak</span>
        </Link>

        {/* View leaderboard link */}
        <Link
          href="/streaks"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black group/link mt-4"
        >
          <span>View Leaderboard</span>
          <NavArrowRight className="h-4 w-4 text-gray-600 group-hover/link:text-black group-hover/link:translate-x-0.5 transition-all" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // User is authenticated but no streak data yet
  if (!streakData) {
    return null;
  }

  const { currentStreak, nextRewardTier, nextRewardDescription, progressToNextReward, daysRemaining } = streakData;

  // Calculate which stars should be filled based on 7-day voting cycle
  // Each day when user votes, one star gets filled
  // When all 7 are filled, cycle resets and starts from beginning
  const totalStars = 7;
  const filledStars = currentStreak === 0 ? 0 : ((currentStreak - 1) % totalStars) + 1;

  return (
    <div className="rounded-2xl border border-gray-200 p-6 bg-white hover:border-gray-300 transition-all duration-300 group">
      {/* Header with streak count and info icon */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {currentStreak} Day Streak
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Never expires</p>
          </div>
          <div className="relative ml-auto">
            <button
              type="button"
              aria-label="Learn more about streaks"
              aria-describedby={showTooltip ? "streak-tooltip" : undefined}
              aria-expanded={showTooltip}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200"
            >
              <InfoCircle className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {showTooltip && (
              <div
                id="streak-tooltip"
                role="tooltip"
                className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 bottom-full mb-3 w-[calc(100vw-2rem)] max-w-72 rounded-2xl bg-black px-4 py-3 text-left text-xs sm:text-sm text-white shadow-xl ring-1 ring-white/10 z-50"
              >
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 h-3 w-3 rotate-45 bg-black ring-1 ring-white/10" aria-hidden="true" />
                <p className="m-0 text-gray-200 leading-snug">
                  Vote regularly to extend your streak and unlock exclusive rewards. Your streak never expires—keep voting to climb the leaderboard!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Star icons showing daily voting progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalStars }).map((_, index) => {
            const isFilled = index < filledStars;
            return (
              <div
                key={index}
              >
                <div className="relative">
                  {isFilled && (
                    <div className="absolute inset-0 bg-black/30 rounded-full blur-md animate-pulse" />
                  )}
                  <div className={`rounded-full p-2 transition-all duration-300 ${
                    isFilled
                      ? "bg-black"
                      : "bg-gray-300"
                  }`}>
                    <StarIcon
                      className="h-4 w-4 text-white transition-all duration-300"
                      aria-label={`Day ${index + 1} of voting cycle ${isFilled ? "completed" : "pending"}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next reward section */}
      {nextRewardTier && (
        <div className="mb-6 border-t border-gray-200 pt-4">
          <div className="flex items-start justify-between mb-1">
            <span className="text-md font-medium text-gray-900">Next Reward</span>
            <span className="text-md font-medium text-black">
              {nextRewardTier} days
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{nextRewardDescription}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-black h-2.5 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progressToNextReward}%` }}
              role="progressbar"
              aria-valuenow={progressToNextReward}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressToNextReward}% progress to next reward`}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
          </div>
          {daysRemaining > 0 && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-gray-600">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} to go
                </p>
              </div>
              <span className="text-xs font-semibold text-black">
                {Math.round(progressToNextReward)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard link */}
      <Link
        href="/streaks"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black group/link"
      >
        <span>View Leaderboard</span>
        <NavArrowRight className="h-4 w-4 text-gray-600 group-hover/link:text-black group-hover/link:translate-x-0.5 transition-all" aria-hidden="true" />
      </Link>
    </div>
  );
}
