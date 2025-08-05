import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryPricingBadge } from "@/components/ui/CategoryPricingBadge";
import GuidePromoCard from "@/components/ui/GuidePromoCard";
import SponsorCard from "@/components/ui/SponsorCard";
import aiFaviIcon from "@/assets/ai-favi.png";
import crownIcon from "@/assets/crown.svg";
import crownBlackIcon from "@/assets/crown-black.svg";
import johnIcon from "@/assets/john.svg";

// Placeholder for authentication state
const isAuthenticated = false; // Replace with real auth logic

export function HomePage() {
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly");
  const [weeklyTimeRemaining, setWeeklyTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [monthlyTimeRemaining, setMonthlyTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [votedApps, setVotedApps] = useState(new Set()); // Single voted apps set for both weekly and monthly
  const [votingLoading, setVotingLoading] = useState(new Set());

  // Mock data for development
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setApps([
        // Week 1 projects (2024-W01)
        {
          id: 1,
          name: "TravelMate Navigator",
          short_description:
            "AI-powered travel planning with real-time updates and local insights",
          logo_url: aiFaviIcon,
          vote_count: 88,
          is_paid: false,
          is_weekly_winner: true, // Won week 1
          is_monthly_winner: true, // Also winning monthly
          is_active: true,
          website_url: "https://example.com",
          categories: ["AI & LLM", "Developer Tools & Platforms"],
          pricing: "Freemium",
          launch_date: "2024-01-01",
          launch_week: "2024-W01",
          launch_month: "2024-01",
        },
        {
          id: 2,
          name: "StayFinder Pro",
          short_description:
            "Find and book unique accommodations worldwide with instant confirmation",
          logo_url: aiFaviIcon,
          vote_count: 64,
          is_paid: true,
          is_weekly_winner: true, // Won week 1 (2nd place)
          is_monthly_winner: false,
          is_active: true,
          website_url: "https://example.com",
          categories: ["APIs & Integrations"],
          pricing: "Paid",
          launch_date: "2024-01-02",
          launch_week: "2024-W01",
          launch_month: "2024-01",
        },
        {
          id: 3,
          name: "LocalEats Discovery",
          short_description:
            "Discover authentic local restaurants and hidden culinary gems",
          logo_url: aiFaviIcon,
          vote_count: 58,
          is_paid: false,
          is_weekly_winner: true, // Won week 1 (3rd place)
          is_monthly_winner: false,
          is_active: true,
          website_url: "https://example.com",
          categories: ["Directory of Directories", "APIs & Integrations"],
          pricing: "Free",
          launch_date: "2024-01-03",
          launch_week: "2024-W01",
          launch_month: "2024-01",
        },

        // Week 2 projects (2024-W02) - new launches but in same month
        {
          id: 4,
          name: "TripBudget Manager",
          short_description:
            "Comprehensive travel expense tracking and budgeting",
          logo_url: aiFaviIcon,
          vote_count: 72, // Higher votes, could win monthly
          is_paid: false,
          is_weekly_winner: false, // Launched in week 2
          is_monthly_winner: true, // Winning monthly 2nd place
          is_active: true,
          website_url: "https://example.com",
          categories: ["Developer Tools & Platforms"],
          pricing: "Freemium",
          launch_date: "2024-01-08",
          launch_week: "2024-W02",
          launch_month: "2024-01",
        },
        {
          id: 5,
          name: "WeatherWise Travel",
          short_description:
            "Weather-based travel planning and packing suggestions",
          logo_url: aiFaviIcon,
          vote_count: 65, // Could win monthly 3rd
          is_paid: false,
          is_weekly_winner: false,
          is_monthly_winner: true, // Winning monthly 3rd place
          is_active: true,
          website_url: "https://example.com",
          categories: ["AI & LLM"],
          pricing: "Free",
          launch_date: "2024-01-09",
          launch_week: "2024-W02",
          launch_month: "2024-01",
        },

        // Week 3 projects (2024-W03) - current week
        {
          id: 6,
          name: "PackSmart",
          short_description:
            "Smart packing lists based on destination and weather",
          logo_url: aiFaviIcon,
          vote_count: 42, // Active current week
          is_paid: false,
          is_weekly_winner: false, // Current week, could still win
          is_monthly_winner: false,
          is_active: true,
          website_url: "https://example.com",
          categories: ["UI/UX", "Design"],
          pricing: "Paid",
          launch_date: "2024-01-15",
          launch_week: "2024-W03", // Current week
          launch_month: "2024-01",
        },
        {
          id: 7,
          name: "CityGuide AI",
          short_description:
            "AI-powered city exploration and local recommendations",
          logo_url: aiFaviIcon,
          vote_count: 19,
          is_paid: false,
          is_weekly_winner: false,
          is_monthly_winner: false,
          is_active: true,
          website_url: "https://example.com",
          categories: ["AI & LLM", "Directory of Directories"],
          pricing: "Freemium",
          launch_date: "2024-01-16",
          launch_week: "2024-W03",
          launch_month: "2024-01",
        },
        {
          id: 8,
          name: "HotelFinder Elite",
          short_description:
            "Premium hotel booking with exclusive member rates",
          logo_url: aiFaviIcon,
          vote_count: 7,
          is_paid: false,
          is_weekly_winner: false,
          is_monthly_winner: false,
          is_active: true,
          website_url: "https://example.com",
          categories: ["APIs & Integrations"],
          pricing: "Paid",
          launch_date: "2024-01-17",
          launch_week: "2024-W03",
          launch_month: "2024-01",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Countdown timers for both weekly and monthly
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Weekly countdown - next Monday
      const nextMonday = new Date();
      nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);

      const weeklyDiff = nextMonday - now;

      if (weeklyDiff > 0) {
        setWeeklyTimeRemaining({
          days: Math.floor(weeklyDiff / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (weeklyDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((weeklyDiff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((weeklyDiff % (1000 * 60)) / 1000),
        });
      }

      // Monthly countdown - first day of next month
      const nextMonth = new Date();
      nextMonth.setMonth(now.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);

      const monthlyDiff = nextMonth - now;

      if (monthlyDiff > 0) {
        setMonthlyTimeRemaining({
          days: Math.floor(monthlyDiff / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (monthlyDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((monthlyDiff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((monthlyDiff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle voting (toggle) - single vote count for both weekly and monthly
  const handleVote = async (appId) => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
      return;
    }

    setVotingLoading((prev) => new Set([...prev, appId]));

    setApps((prevApps) => {
      return prevApps.map((app) => {
        if (app.id === appId) {
          const hasVoted = votedApps.has(appId);
          return {
            ...app,
            vote_count: hasVoted ? app.vote_count - 1 : app.vote_count + 1,
          };
        }
        return app;
      });
    });

    setVotedApps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });

    setVotingLoading((prev) => {
      const newSet = new Set(prev);
      newSet.delete(appId);
      return newSet;
    });
  };

  // Sort apps by vote_count descending - filter based on active tab
  const getSortedApps = () => {
    // For this demo, we'll simulate current week as 2024-W03
    const currentWeek = "2024-W03";
    const currentMonth = "2024-01";

    // Filter apps based on active tab
    const filteredApps = apps.filter((app) => {
      if (activeTab === "weekly") {
        // Weekly tab shows only current week's launches
        return app.launch_week === currentWeek;
      } else {
        // Monthly tab shows all apps from current month
        return app.launch_month === currentMonth;
      }
    });

    return [...filteredApps].sort((a, b) => {
      // If both apps have the same vote count (including 0), prioritize paid launches
      if (a.vote_count === b.vote_count) {
        if (a.is_paid && !b.is_paid) return -1;
        if (!a.is_paid && b.is_paid) return 1;
        return 0; // Both same paid status and same vote count
      }

      // Otherwise, sort by vote count (higher votes first)
      return b.vote_count - a.vote_count;
    });
  };

  // Get current voted apps - same for both weekly and monthly
  const getCurrentVotedApps = () => {
    return votedApps;
  };

  // Get current time remaining based on active tab
  const getCurrentTimeRemaining = () => {
    return activeTab === "weekly" ? weeklyTimeRemaining : monthlyTimeRemaining;
  };

  // Get current vote count for an app - same for both weekly and monthly
  const getCurrentVoteCount = (app) => {
    return app.vote_count;
  };

  // Calculate ranking with ties (shared positions) - same for both weekly and monthly
  const getAppRanking = (sortedApps) => {
    const rankings = [];
    let currentRank = 1;

    for (let i = 0; i < sortedApps.length; i++) {
      if (i > 0 && sortedApps[i].vote_count !== sortedApps[i - 1].vote_count) {
        currentRank = i + 1;
      }
      rankings.push({
        ...sortedApps[i],
        displayRank: currentRank,
        isTopThree: currentRank <= 3,
      });
    }

    return rankings;
  };

  function pad(num) {
    return num.toString().padStart(2, "0");
  }
  return (
    <div className="flex flex-col items-start md:flex-row gap-10 space-y-0">
      <div className="left-side w-full md:flex-1">
        {/* Hero Section */}
        <section className="text-center pt-8 pb-8 max-w-2xl mr-auto">
          <h1 className="text-6xl font-medium text-gray-900 mb-6 text-left">
            Launch Your Directory &amp;&nbsp;Get a&nbsp;DR22 Backlink
          </h1>
          <p className="text-xl font-normal text-gray-900 text-left mb-6 max-w-xl">
            Submit your project and get a&nbsp;DR22&nbsp;backlink, early
            exposure, and reach other builders launching curated directories.
          </p>
        </section>

        {/* Current Launch Apps */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-medium text-gray-900 capitalize">
              Best {activeTab} products
            </h2>
            <Badge variant="secondary" className="text-base">
              {activeTab === "weekly"
                ? `${getSortedApps().length} / 15 Apps`
                : `${getSortedApps().length} Apps`}
            </Badge>
          </div>

          {/* Tabs for Weekly/Monthly */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger className="cursor-pointer" value="weekly">
                Weekly Launch
              </TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="monthly">
                Monthly Launch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-4">
              {/* Weekly Countdown Timer */}
              <div className="bg-gray-100 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    New weekly launches in
                  </h2>
                  <p className="text-gray-800 text-sm">
                    Top 3 weekly products win badges and get dofollow backlinks.{" "}
                    <Link
                      to="/faq"
                      className="font-semibold underline underline-offset-4"
                    >
                      More details.
                    </Link>
                  </p>
                </div>
                <div className="flex mt-4 md:mt-0">
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().days)} :
                      </div>
                      <div className="text-[8px] md:text-xs">days</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().hours)} :
                      </div>
                      <div className="text-[8px] md:text-xs">hours</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().minutes)} :
                      </div>
                      <div className="text-[8px] md:text-xs">mins</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().seconds)}
                      </div>
                      <div className="text-[8px] md:text-xs">secs</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="mt-4">
              {/* Monthly Countdown Timer */}
              <div className="bg-gray-100 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 text-left">
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    New monthly launches in
                  </h2>
                  <p className="text-gray-800 text-sm">
                    Top 3 monthly products win badges and get dofollow
                    backlinks.{" "}
                    <Link
                      to="/faq"
                      className="font-semibold underline underline-offset-4"
                    >
                      More details.
                    </Link>
                  </p>
                </div>
                <div className="flex mt-4 md:mt-0">
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().days)} :
                      </div>
                      <div className="text-[8px] md:text-xs">days</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().hours)} :
                      </div>
                      <div className="text-[8px] md:text-xs">hours</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().minutes)} :
                      </div>
                      <div className="text-[8px] md:text-xs">mins</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className=" text-gray-900 px-1">
                      <div className="text-xl font-medium">
                        {pad(getCurrentTimeRemaining().seconds)}
                      </div>
                      <div className="text-[8px] md:text-xs">secs</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full bg-white rounded-xl shadow animate-pulse h-32"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {getAppRanking(getSortedApps()).map((app) => (
                <Link
                  key={app.id}
                  to={`/app/${app.id}`}
                  className="block group"
                >
                  <div
                    className={`w-full bg-white rounded-xl border flex flex-row items-center p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5 
                      ${app.displayRank === 1 ? "border-gray-900" : ""}
                      ${app.displayRank === 2 ? "border-gray-600" : ""}
                      ${app.displayRank === 3 ? "border-gray-400" : ""}`}
                  >
                    {/* Left: Logo, Name, Description */}
                    <div className="flex items-center flex-1 min-w-0 gap-4">
                      <img
                        src={app.logo_url}
                        alt={app.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate text-lg">
                            {app.name}
                          </h3>
                          {app.displayRank <= 3 && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-normal
                            ${
                              app.displayRank === 1
                                ? "bg-gray-900 text-white"
                                : ""
                            }
                            ${
                              app.displayRank === 2
                                ? "bg-gray-300 text-gray-900"
                                : ""
                            }
                            ${
                              app.displayRank === 3
                                ? "bg-gray-200 text-gray-900"
                                : ""
                            }
                          `}
                            >
                              <img
                                src={crownIcon}
                                alt="Badge"
                                className={`w-4 mr-0.5
                              ${app.displayRank === 1 ? "inline" : ""}
                              ${app.displayRank === 2 ? "hidden" : ""}
                              ${app.displayRank === 3 ? "hidden" : ""}
                            `}
                              />

                              <img
                                src={crownBlackIcon}
                                alt="Badge"
                                className={`w-4 mr-0.5
                              ${app.displayRank === 1 ? "hidden" : ""}
                              ${app.displayRank === 2 ? "inline" : ""}
                              ${app.displayRank === 3 ? "inline" : ""}
                            `}
                              />

                              {app.displayRank === 1 && "1st"}
                              {app.displayRank === 2 && "2nd"}
                              {app.displayRank === 3 && "3rd"}
                            </span>
                          )}
                          {app.is_paid && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Premium
                            </span>
                          )}
                          {app.is_weekly_winner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Weekly Winner
                            </span>
                          )}
                          {app.is_monthly_winner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Monthly Winner
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2 mt-1">
                          {app.short_description}
                        </p>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.categories.map((category) => (
                            <CategoryPricingBadge
                              key={category}
                              variant="category"
                              className="px-2 py-0.5 rounded-sm text-xs font-medium"
                            >
                              {category}
                            </CategoryPricingBadge>
                          ))}
                          <CategoryPricingBadge
                            variant="pricing"
                            className="px-2 py-0.5 rounded-sm text-xs font-medium"
                          >
                            {app.pricing}
                          </CategoryPricingBadge>
                        </div>
                      </div>
                    </div>
                    {/* Right: Buttons */}
                    <div className="flex flex-row items-center gap-4 ml-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Dofollow if: Top 3 in current rankings OR weekly winner OR monthly winner OR paid
                          const isCurrentTopThree = app.displayRank <= 3;
                          const isWinner =
                            isCurrentTopThree ||
                            app.is_weekly_winner ||
                            app.is_monthly_winner;
                          const rel =
                            isWinner || app.is_paid ? "dofollow" : "nofollow";
                          window.open(
                            app.website_url,
                            "_blank",
                            rel === "dofollow" ? "" : "nofollow"
                          );
                        }}
                        className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleVote(app.id);
                        }}
                        disabled={votingLoading.has(app.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-20 text-md font-semibold transition duration-300 ease-in-out -translate-y-0.5
                        ${
                          getCurrentVotedApps().has(app.id)
                            ? "bg-gray-900 text-white translate-0"
                            : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-gray-900 hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                        }
                        ${
                          votingLoading.has(app.id)
                            ? "opacity-50 cursor-default"
                            : "cursor-pointer"
                        }`}
                      >
                        <ThumbsUp
                          className={`h-4.5 w-4.5 ${
                            votingLoading.has(app.id) ? "animate-pulse" : ""
                          }`}
                        />
                        <span>{getCurrentVoteCount(app)}</span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && apps.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Apps This Week
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to submit your travel app for this launch week!
                </p>
                <Link to="/submit">
                  <Button>Submit Your App</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <div className="right-side w-full md:max-w-96 md:w-full md:sticky md:top-16 mt-10 md:mt-0">
        <aside className="space-y-8 py-8 md:py-8">
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-md font-medium text-gray-900 uppercase">
              Directory guide
            </h2>
            <GuidePromoCard
              imageSrc={johnIcon}
              name="John Rush"
              subtitle="Creator of MarsX (uniting AI, NoCode, and Code)"
              title="Want to build your own directory?"
              description="I'll teach you everything I learned the hard way over the years of building one of the most successful directories on the internet."
              buttonText="Get Directory Guide Now"
              buttonLink="https://johnrush.me/directory-guide/"
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-md font-medium text-gray-900 uppercase">
              Our partners
            </h2>
            <div className="flex flex-col gap-4 w-full">
              <SponsorCard
                sponsor={{
                  logo: "/src/assets/backlinkslist-logo.png",
                  name: "Backlinks List",
                  description:
                    "One platform for Stripe payments, auth, CRM, email + help desk. Perfect for SaaS + memberships. Try free.",
                  url: "https://backlinkslist.com",
                }}
              />
              <SponsorCard />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <a
              href="https://frogdr.com/directoryhunt.org?utm_source=directoryhunt.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://frogdr.com/directoryhunt.org/badge-white.svg"
                alt="Monitor your Domain Rating with FrogDR"
                className="w-full h-auto"
              />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
