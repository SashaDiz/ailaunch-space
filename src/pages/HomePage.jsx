import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useTransition,
} from "react";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryPricingBadge } from "@/components/ui/CategoryPricingBadge";
import GuidePromoCard from "@/components/ui/GuidePromoCard";
import SponsorCard from "@/components/ui/SponsorCard";
import { useApi, useVoting } from "@/hooks/useApi";
import { useAuth } from "@clerk/clerk-react";
import crownIcon from "@/assets/crown.svg";
import crownBlackIcon from "@/assets/crown-black.svg";
import johnIcon from "@/assets/john.svg";
import backlinksListLogo from "@/assets/backlinkslist-logo.svg";

// Self-contained timer component that manages its own state and doesn't affect parent
const CountdownTimer = memo(({ type, className }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();

      let targetDate;
      if (type === "weekly") {
        // Next Monday
        targetDate = new Date();
        targetDate.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
        targetDate.setHours(0, 0, 0, 0);
      } else {
        // First day of next month
        targetDate = new Date();
        targetDate.setMonth(now.getMonth() + 1, 1);
        targetDate.setHours(0, 0, 0, 0);
      }

      const diff = targetDate - now;

      if (diff <= 0) {
        startTransition(() => {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        });
        return;
      }

      const newTime = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };

      startTransition(() => {
        setTimeRemaining((prev) => {
          // Only update if values actually changed
          if (
            prev.days !== newTime.days ||
            prev.hours !== newTime.hours ||
            prev.minutes !== newTime.minutes ||
            prev.seconds !== newTime.seconds
          ) {
            return newTime;
          }
          return prev;
        });
      });
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [type]);

  const pad = (num) => num.toString().padStart(2, "0");

  return (
    <div
      className={`flex mt-4 md:mt-0 ${className}`}
      style={{ willChange: "auto" }}
    >
      <div className="text-center">
        <div className=" text-gray-900 px-1">
          <div className="text-xl font-medium transition-all duration-75 ease-out tabular-nums">
            {pad(timeRemaining.days)} :
          </div>
          <div className="text-[8px] md:text-xs">days</div>
        </div>
      </div>
      <div className="text-center">
        <div className=" text-gray-900 px-1">
          <div className="text-xl font-medium transition-all duration-75 ease-out tabular-nums">
            {pad(timeRemaining.hours)} :
          </div>
          <div className="text-[8px] md:text-xs">hours</div>
        </div>
      </div>
      <div className="text-center">
        <div className=" text-gray-900 px-1">
          <div className="text-xl font-medium transition-all duration-75 ease-out tabular-nums">
            {pad(timeRemaining.minutes)} :
          </div>
          <div className="text-[8px] md:text-xs">mins</div>
        </div>
      </div>
      <div className="text-center">
        <div className=" text-gray-900 px-1">
          <div className="text-xl font-medium transition-all duration-75 ease-out tabular-nums">
            {pad(timeRemaining.seconds)}
          </div>
          <div className="text-[8px] md:text-xs">secs</div>
        </div>
      </div>
    </div>
  );
});

export function HomePage() {
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly");

  const { isSignedIn } = useAuth();
  const { vote, votingLoading, votedApps } = useVoting();

  // Fetch apps data from API
  const {
    data: appsData,
    loading: appsLoading,
    error: appsError,
  } = useApi("/apps");

  // Update apps when data is loaded
  useEffect(() => {
    if (appsData && appsData.success && appsData.apps) {
      setApps(appsData.apps);
    } else if (appsError) {
      console.error("Failed to load apps:", appsError);
      // Fallback to empty array on error
      setApps([]);
    }
  }, [appsData, appsError]);

  // Handle voting - wrapped in useCallback to prevent unnecessary re-renders
  const handleVote = useCallback(
    async (appId, appSlug) => {
      if (!isSignedIn) {
        window.location.href = "/sign-in";
        return;
      }

      try {
        await vote(appSlug, appId);
        // Update the app's vote count in the local state
        setApps((prevApps) =>
          prevApps.map((app) =>
            app._id === appId || app.id === appId
              ? { ...app, vote_count: (app.vote_count || app.upvotes || 0) + 1 }
              : app
          )
        );
      } catch (error) {
        console.error("Voting failed:", error);
        // You could show a toast notification here
      }
    },
    [isSignedIn, vote]
  );

  // Helper function to get week number (moved outside of sorting function for optimization)
  const getWeekNumber = useCallback((date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }, []);

  // Separate apps logic from timer logic to prevent timer updates from affecting app rendering
  const sortedApps = useMemo(() => {
    if (!apps || apps.length === 0) return [];

    // Get current week and month - use a static date calculation to avoid timer interference
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format

    // Filter apps based on active tab
    const filteredApps = apps.filter((app) => {
      if (activeTab === "weekly") {
        // Weekly tab shows only current week's launches
        const appWeek =
          app.launch_week ||
          `${currentYear}-W${currentWeek.toString().padStart(2, "0")}`;
        return (
          appWeek ===
          `${currentYear}-W${currentWeek.toString().padStart(2, "0")}`
        );
      } else {
        // Monthly tab shows all apps from current month
        const appMonth =
          app.launch_month || app.createdAt?.slice(0, 7) || currentMonth;
        return appMonth === currentMonth;
      }
    });

    return [...filteredApps].sort((a, b) => {
      const aVotes = a.vote_count || a.upvotes || 0;
      const bVotes = b.vote_count || b.upvotes || 0;

      // If both apps have the same vote count, prioritize paid launches
      if (aVotes === bVotes) {
        const aPaid = a.is_paid || a.pricing === "Paid";
        const bPaid = b.is_paid || b.pricing === "Paid";
        if (aPaid && !bPaid) return -1;
        if (!aPaid && bPaid) return 1;
        return 0;
      }

      // Otherwise, sort by vote count (higher votes first)
      return bVotes - aVotes;
    });
  }, [apps, activeTab, getWeekNumber]); // Removed currentTime dependency

  // Memoized app ranking to prevent recalculation on every render
  const rankedApps = useMemo(() => {
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
  }, [sortedApps]);

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
                ? `${sortedApps.length} / 15 Apps`
                : `${sortedApps.length} Apps`}
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
                <CountdownTimer type="weekly" />
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
                <CountdownTimer type="monthly" />
              </div>
            </TabsContent>
          </Tabs>

          {appsLoading ? (
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
              {rankedApps.map((app) => (
                <Link
                  key={app._id || app.id}
                  to={`/app/${app.slug || app._id || app.id}`}
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
                        src={
                          app.logo_url || app.logo || "/api/placeholder/80/80"
                        }
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
                          {(app.is_paid || app.pricing === "Paid") && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Premium
                            </span>
                          )}
                          {(app.is_weekly_winner ||
                            app.weekly_ranking <= 3) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Weekly Winner
                            </span>
                          )}
                          {(app.is_monthly_winner || app.featured) && (
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
                          const websiteUrl = app.website_url || app.website;
                          if (websiteUrl) {
                            window.open(websiteUrl, "_blank");
                          }
                        }}
                        className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleVote(
                            app._id || app.id,
                            app.slug ||
                              app.name?.toLowerCase().replace(/\s+/g, "-")
                          );
                        }}
                        disabled={votingLoading.has(app._id || app.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-20 text-md font-semibold transition duration-300 ease-in-out -translate-y-0.5
                        ${
                          votedApps.has(app._id || app.id)
                            ? "bg-gray-900 text-white translate-0"
                            : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-gray-900 hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                        }
                        ${
                          votingLoading.has(app._id || app.id)
                            ? "opacity-50 cursor-default"
                            : "cursor-pointer"
                        }`}
                      >
                        <ThumbsUp
                          className={`h-4.5 w-4.5 ${
                            votingLoading.has(app._id || app.id)
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        <span>{app.vote_count || app.upvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!appsLoading && apps.length === 0 && (
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
                  logo: backlinksListLogo,
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
