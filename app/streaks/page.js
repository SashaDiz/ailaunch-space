"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FireFlame,
  NavArrowLeft,
  Crown,
  Spark,
  Community,
  Gift,
  CheckCircle,
  Copy,
  Check,
  Flash,
} from "iconoir-react";

// Custom Star Icon Component (same as StreakCard)
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

// Vote Count Icon Component for power_up milestones
const VoteCountIcon = ({ className, ...props }) => (
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
      d="M16.0096 2.3203L15 1.98173L14.6628 0.963857C14.5539 0.634958 14.0128 0.634958 13.9039 0.963857L13.5667 1.98173L12.5571 2.3203C12.3938 2.37512 12.2828 2.52882 12.2828 2.70294C12.2828 2.87706 12.3938 3.03077 12.5571 3.08558L13.5667 3.42416L13.9039 4.44202C13.9584 4.60647 14.111 4.71718 14.2828 4.71718C14.4546 4.71718 14.6083 4.6054 14.6617 4.44202L14.9989 3.42416L16.0085 3.08558C16.1718 3.03077 16.2828 2.87706 16.2828 2.70294C16.2828 2.52882 16.1729 2.37512 16.0096 2.3203Z"
      fill="currentColor"
      data-color="color-2"
    />
    <path
      d="M1.75 3C2.16421 3 2.5 2.66421 2.5 2.25C2.5 1.83579 2.16421 1.5 1.75 1.5C1.33579 1.5 1 1.83579 1 2.25C1 2.66421 1.33579 3 1.75 3Z"
      fill="currentColor"
      data-color="color-2"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.41101 2.5C4.92601 2.5 4.45801 2.702 4.12601 3.054L1.72301 5.61C1.14201 6.228 1.09001 7.167 1.60001 7.844L7.59301 15.8C7.92801 16.245 8.44101 16.5 9.00001 16.5C9.55901 16.5 10.072 16.245 10.407 15.8L16.4 7.844C16.6468 7.51635 16.762 7.12709 16.7493 6.74266C16.7452 6.33196 16.4102 6 15.9985 6H12.398L10.7852 2.90354C10.656 2.65555 10.3996 2.5 10.12 2.5H5.41101ZM8.99901 13.905L10.933 7.5H7.06501L8.99901 13.905ZM5.41001 4C5.33701 4 5.26701 4.03 5.21801 4.082L3.41501 6H5.60101L6.64301 4H5.41001Z"
      fill="currentColor"
    />
  </svg>
);

// Discount Icon Component for discount and free_premium milestones
const DiscountIcon = ({ className, ...props }) => (
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
      d="M14.25,3h-5.75c-.414,0-.75,.336-.75,.75,0,.551-.449,1-1,1s-1-.449-1-1c0-.414-.336-.75-.75-.75h-1.25c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h1.25c.414,0,.75-.336,.75-.75,0-.551,.449-1,1-1s1,.449,1,1c0,.414,.336,.75,.75,.75h5.75c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75ZM6.75,11.188c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm0-2.875c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
      fill="currentColor"
    />
  </svg>
);
import { useUser } from "../hooks/useUser";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function StreaksPage() {
  const { user, loading: userLoading } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leaderboard
        const leaderboardResponse = await fetch("/api/streaks?action=leaderboard");
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData.data.leaderboard || []);
        }

        // Fetch user's streak data (if authenticated)
        if (user?.id) {
          const streakResponse = await fetch("/api/streaks");
          if (streakResponse.ok) {
            const streakResult = await streakResponse.json();
            setStreakData(streakResult.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch streaks data:", error);
        toast.error("Failed to load streaks data");
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchData();
    }
  }, [user?.id, userLoading]);

  const handleClaimReward = async (rewardId) => {
    try {
      setClaimingReward(rewardId);
      const response = await fetch("/api/streaks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data.discountCode) {
          toast.success("Reward claimed successfully! Your discount code is ready to use.");
        } else {
          toast.success("Reward claimed successfully!");
        }
        // Refresh streak data by re-fetching
        if (user?.id) {
          try {
            const streakResponse = await fetch("/api/streaks");
            if (streakResponse.ok) {
              const streakResult = await streakResponse.json();
              setStreakData(streakResult.data);
            }
          } catch (error) {
            console.error("Failed to refresh streak data:", error);
          }
        }
      } else {
        toast.error(data.error || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Failed to claim reward:", error);
      toast.error("Failed to claim reward");
    } finally {
      setClaimingReward(null);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md animate-pulse" />
          <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500 relative z-10" style={{ color: '#FFD700', fill: '#FFD700' }} />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-gray-300/30 rounded-full blur-md" />
          <Crown className="h-6 w-6 relative z-10" style={{ color: '#C0C0C0', fill: '#C0C0C0' }} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-orange-300/30 rounded-full blur-md" />
          <Crown className="h-6 w-6 relative z-10" style={{ color: '#CD7F32', fill: '#CD7F32' }} />
        </div>
      );
    }
    return (
      <span className="text-sm font-bold text-gray-500 min-w-[24px] text-center">
        #{rank}
      </span>
    );
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const getAvatarBorderStyle = (level) => {
    if (level === 0) return {};
    if (level === 1) return { border: "2px solid #000000", borderRadius: "50%" };
    if (level === 2) return { border: "3px solid #000000", borderRadius: "50%" };
    return {};
  };


  // Show loading spinner while data is being fetched
  if (loading || userLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner 
            fullScreen={true} 
            message="Loading streaks leaderboard and your progress..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link 
                href="/" 
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <NavArrowLeft className="h-4 w-4" aria-hidden="true" />
                Home
              </Link>
            </li>
            <li className="text-gray-400" aria-hidden="true">/</li>
            <li>
              <span className="text-gray-900 font-medium">Streaks Leaderboard</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3">
              <h1 className="text-3xl font-bold text-gray-900">Streaks Leaderboard</h1>
              <p className="text-gray-600 mt-1">
                Top voters by total days voted. Your streak never expires!
              </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column - Leaderboard */}
          <div className="lg:col-span-2">
            <div>
              
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Community className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                  <p className="text-gray-500 font-medium">No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <Link
                      key={entry.userId}
                      href={`/user/${entry.userId}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-black hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer group"
                    >
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0 relative">
                        {entry.avatar ? (
                          <Image
                            src={entry.avatar}
                            alt={entry.username}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-gray-300 transition-all"
                            style={getAvatarBorderStyle(entry.avatarBorderLevel)}
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-700 font-bold text-lg ring-2 ring-gray-100 group-hover:ring-gray-300 transition-all"
                            style={getAvatarBorderStyle(entry.avatarBorderLevel)}
                          >
                            {entry.username[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-gray-900 group-hover:text-black truncate text-base">
                            {entry.username}
                          </span>
                          {entry.voteMultiplier > 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-900 text-xs font-bold rounded-md border border-gray-300">
                              <Flash className="h-3 w-3" aria-hidden="true" />
                              x{entry.voteMultiplier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <StarIcon className="h-4 w-4 text-black fill-black" aria-hidden="true" />
                            <span className="text-sm font-semibold text-gray-700">
                              {entry.streak} {entry.streak === 1 ? "day" : "days"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - User rewards */}
          <div className="lg:col-span-1">
            {user?.id && streakData ? (
              <div className="space-y-6">
                {/* Your Streak Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-md font-bold text-gray-900">Your Streak</h2>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {streakData.currentStreak}
                      </span>
                      <span className="text-lg text-gray-600 font-medium">days</span>
                    </div>
                  </div>
                  {streakData.voteMultiplier > 1 && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-100 border border-gray-300">
                      <div className="flex items-center gap-2">
                        <Flash className="h-4 w-4 text-black" aria-hidden="true" />
                        <span className="text-sm font-semibold text-gray-900">
                          Vote Multiplier: <span className="text-black">x{streakData.voteMultiplier}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Milestones section */}
                {streakData.milestones && (() => {
                  // Find the next unachieved milestone
                  const nextMilestone = streakData.milestones.find(m => !m.achieved);
                  
                  // Calculate progress to next milestone
                  let progressPercentage = 100;
                  let daysRemaining = 0;
                  let nextTier = null;
                  
                  if (nextMilestone) {
                    const milestoneIndex = streakData.milestones.findIndex(m => m.tier === nextMilestone.tier);
                    const previousTier = milestoneIndex > 0 
                      ? streakData.milestones[milestoneIndex - 1].tier 
                      : 0;
                    const progressRange = nextMilestone.tier - previousTier;
                    const currentProgress = Math.max(0, streakData.currentStreak - previousTier);
                    progressPercentage = Math.min(100, Math.round((currentProgress / progressRange) * 100));
                    daysRemaining = Math.max(0, nextMilestone.tier - streakData.currentStreak);
                    nextTier = nextMilestone.tier;
                  }
                  
                  return (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <h3 className="text-md font-bold text-gray-900">Streak Milestones</h3>
                    </div>
                    
                    {/* Single progress bar for next milestone */}
                    {nextMilestone && (
                      <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            Progress to {nextTier} days milestone
                          </span>
                          <span className="text-sm font-semibold text-gray-700">
                            {streakData.currentStreak} / {nextTier}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full bg-black transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                            role="progressbar"
                            aria-valuenow={progressPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progress to ${nextTier} days milestone: ${progressPercentage}%`}
                          />
                        </div>
                        <p className="text-xs text-gray-600">
                          {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining until next reward
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {streakData.milestones.map((milestone) => {
                        const isAchieved = milestone.achieved;
                        const isUnlocked = milestone.unlocked;
                        const reward = milestone.reward;
                        const isNext = !isAchieved && streakData.currentStreak < milestone.tier;
                        
                        return (
                          <div
                            key={milestone.tier}
                            className={`p-4 rounded-xl border transition-all duration-300 ${
                              isAchieved
                                ? "border-black bg-gray-100 shadow-sm"
                                : isNext
                                ? "border-gray-400 bg-gray-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {isAchieved ? (
                                  <div className="flex-shrink-0">
                                    <div className="p-1.5 rounded-lg bg-black">
                                      <CheckCircle className="h-4 w-4 text-white" aria-hidden="true" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-200">
                                    {milestone.type === "power_up" ? (
                                      <VoteCountIcon className="h-4 w-4 text-gray-700" aria-hidden="true" />
                                    ) : milestone.type === "discount" || milestone.type === "free_premium" ? (
                                      <DiscountIcon className="h-4 w-4 text-gray-700" aria-hidden="true" />
                                    ) : (
                                      <span className="text-xs font-bold text-gray-500">{milestone.tier}</span>
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-base ${
                                      isAchieved ? "text-black" : "text-gray-700"
                                    }`}>
                                      {milestone.tier} days
                                    </span>
                                    {isAchieved && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-xs font-semibold rounded-md">
                                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                                        Achieved
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-xs leading-relaxed ${
                                    isAchieved ? "text-gray-700" : "text-gray-600"
                                  }`}>
                                    {milestone.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Show claim button or code display for unlocked discount/free_premium rewards */}
                            {isUnlocked && reward && (milestone.type === "discount" || milestone.type === "free_premium") && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {reward.discount_code ? (
                                  /* Code is available - show it with copy button */
                                  <div className="space-y-2">
                                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                                      reward.is_used 
                                        ? "bg-gray-100 border border-gray-200" 
                                        : "bg-gray-100 border border-gray-300"
                                    }`}>
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {reward.is_used && (
                                          <CheckCircle className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold ${
                                              reward.is_used ? "text-gray-600" : "text-black"
                                            }`}>
                                              Discount Code
                                            </span>
                                            {reward.is_used && (
                                              <span className="text-xs text-gray-500">(Used)</span>
                                            )}
                                          </div>
                                          <code className="text-sm font-mono font-bold text-gray-900 break-all">
                                            {reward.discount_code}
                                          </code>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleCopyCode(reward.discount_code)}
                                        className="ml-3 p-2 rounded-lg hover:bg-white/60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-black flex-shrink-0"
                                        aria-label="Copy discount code"
                                        title="Copy code"
                                      >
                                        {copiedCode === reward.discount_code ? (
                                          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                                        ) : (
                                          <Copy className="h-4 w-4 text-gray-700" aria-hidden="true" />
                                        )}
                                      </button>
                                    </div>
                                    {copiedCode === reward.discount_code && (
                                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200 animate-in fade-in-0">
                                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                                        <span className="text-xs font-medium text-green-800">
                                          Code copied to clipboard!
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Code not yet claimed - show claim button */
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => handleClaimReward(reward.id)}
                                      disabled={claimingReward === reward.id}
                                      className="w-full px-4 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black flex items-center justify-center gap-2"
                                    >
                                      {claimingReward === reward.id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Claiming...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Gift className="h-4 w-4" aria-hidden="true" />
                                          <span>Claim Reward</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
                <div className="p-4 rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FireFlame className="h-8 w-8 text-gray-400" aria-hidden="true" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to track your streak</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Join the leaderboard and start earning rewards!
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <Spark className="h-4 w-4" aria-hidden="true" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
