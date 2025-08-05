import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ExternalLink, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryPricingBadge } from "@/components/ui/CategoryPricingBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GuidePromoCard from "@/components/ui/GuidePromoCard";
import SponsorCard from "@/components/ui/SponsorCard";
import johnIcon from "@/assets/john.svg";
import crownIcon from "@/assets/crown.svg";
import crownBlackIcon from "@/assets/crown-black.svg";

export function PastLaunchesPage() {
  const [pastLaunches, setPastLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [filteredApps, setFilteredApps] = useState([]);

  // Mock data for development
  useEffect(() => {
    setTimeout(() => {
      setPastLaunches([
        {
          week_start: "2025-06-09T00:00:00Z",
          week_end: "2025-06-15T23:59:59Z",
          apps: [
            {
              id: 101,
              name: "FlightTracker Pro",
              short_description:
                "Real-time flight tracking with predictive delay alerts",
              logo_url:
                "https://via.placeholder.com/60x60/EF4444/FFFFFF?text=FT",
              vote_count: 89,
              is_winner: true,
              is_paid: false,
              position: 1,
              website_url: "https://example.com",
              categories: ["AI & LLM", "APIs & Integrations"],
              pricing: "Freemium",
            },
            {
              id: 102,
              name: "HotelFinder Elite",
              short_description:
                "Premium hotel booking with exclusive member rates",
              logo_url:
                "https://via.placeholder.com/60x60/10B981/FFFFFF?text=HF",
              vote_count: 76,
              is_winner: true,
              is_paid: true,
              position: 2,
              website_url: "https://example.com",
              categories: ["APIs & Integrations"],
              pricing: "Paid",
            },
            {
              id: 103,
              name: "CityGuide AI",
              short_description:
                "AI-powered city exploration and local recommendations",
              logo_url:
                "https://via.placeholder.com/60x60/F59E0B/FFFFFF?text=CG",
              vote_count: 64,
              is_winner: true,
              is_paid: false,
              position: 3,
              website_url: "https://example.com",
              categories: ["AI & LLM", "Directory of Directories"],
              pricing: "Free",
            },
            {
              id: 104,
              name: "PackSmart",
              short_description:
                "Smart packing lists based on destination and weather",
              logo_url:
                "https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=PS",
              vote_count: 52,
              is_winner: false,
              is_paid: false,
              position: 4,
              website_url: "https://example.com",
              categories: ["UI/UX", "Design"],
              pricing: "Freemium",
            },
          ],
        },
        {
          week_start: "2025-06-02T00:00:00Z",
          week_end: "2025-06-08T23:59:59Z",
          apps: [
            {
              id: 201,
              name: "TripBudget Manager",
              short_description:
                "Comprehensive travel expense tracking and budgeting",
              logo_url:
                "https://via.placeholder.com/60x60/06B6D4/FFFFFF?text=TB",
              vote_count: 94,
              is_winner: true,
              is_paid: true,
              position: 1,
              website_url: "https://example.com",
              categories: ["Developer Tools & Platforms"],
              pricing: "Freemium",
            },
            {
              id: 202,
              name: "LocalEats Finder",
              short_description:
                "Discover authentic local restaurants and street food",
              logo_url:
                "https://via.placeholder.com/60x60/F97316/FFFFFF?text=LE",
              vote_count: 81,
              is_winner: true,
              is_paid: false,
              position: 2,
              website_url: "https://example.com",
              categories: ["Directory of Directories", "APIs & Integrations"],
              pricing: "Free",
            },
            {
              id: 203,
              name: "WeatherWise Travel",
              short_description:
                "Weather-based travel planning and packing suggestions",
              logo_url:
                "https://via.placeholder.com/60x60/84CC16/FFFFFF?text=WW",
              vote_count: 69,
              is_winner: true,
              is_paid: false,
              position: 3,
              website_url: "https://example.com",
              categories: ["AI & LLM"],
              pricing: "Paid",
            },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter apps based on selected week
  useEffect(() => {
    if (selectedWeek === "all") {
      // Combine all apps from all weeks and sort by vote count
      const allApps = pastLaunches.flatMap((launch) =>
        launch.apps.map((app) => ({
          ...app,
          week_start: launch.week_start,
          week_end: launch.week_end,
        }))
      );
      setFilteredApps(
        allApps.sort((a, b) => {
          // If both apps have the same vote count (including 0), prioritize paid launches
          if (a.vote_count === b.vote_count) {
            if (a.is_paid && !b.is_paid) return -1;
            if (!a.is_paid && b.is_paid) return 1;
            return 0; // Both same paid status and same vote count
          }

          // Otherwise, sort by vote count (higher votes first)
          return b.vote_count - a.vote_count;
        })
      );
    } else {
      // Show apps from selected week only
      const selectedLaunch = pastLaunches.find(
        (launch) => launch.week_start === selectedWeek
      );
      if (selectedLaunch) {
        setFilteredApps(
          selectedLaunch.apps.sort((a, b) => a.position - b.position)
        );
      } else {
        setFilteredApps([]);
      }
    }
  }, [pastLaunches, selectedWeek]);

  const handleWeekChange = (value) => {
    setSelectedWeek(value);
  };

  // Calculate ranking with ties for "all" view (shared positions)
  const getAppRanking = (apps) => {
    const rankings = [];
    let currentRank = 1;

    for (let i = 0; i < apps.length; i++) {
      if (i > 0 && apps[i].vote_count !== apps[i - 1].vote_count) {
        currentRank = i + 1;
      }
      rankings.push({
        ...apps[i],
        displayRank: currentRank,
        isTopThree: currentRank <= 3,
      });
    }

    return rankings;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start md:flex-row gap-6 md:gap-10 space-y-0">
      <div className="left-side w-full md:flex-1 px-4 md:px-0">
        {/* Header */}
        <section className="text-center pt-4 md:pt-8 pb-4 md:pb-8 max-w-2xl mr-auto">
          <h2 className="text-5xl font-medium text-gray-900 mb-2 md:mb-3 text-left">
            Past Launches
          </h2>
          <p className="text-lg md:text-xl font-normal text-gray-900 text-left mb-4 max-w-xl">
            Explore previous launch weeks and discover winning travel apps
          </p>
        </section>

        {/* Week Filter Dropdown */}
        <div className="flex flex-col gap-4 items-start md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-medium text-gray-900">
            {selectedWeek === "all" ? "All Launches" : "Week Results"}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full md:w-auto">
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-full sm:w-[280px] transition-all duration-300 cursor-pointer shadow-none hover:border-gray-900">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Launches</SelectItem>
                {pastLaunches.map((launch) => (
                  <SelectItem
                    key={launch.week_start}
                    value={launch.week_start}
                    className="cursor-pointer"
                  >
                    {new Date(launch.week_start).toLocaleDateString()} -{" "}
                    {new Date(launch.week_end).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="secondary"
              className="text-sm md:text-base self-start sm:self-auto"
            >
              {filteredApps.length} Apps
            </Badge>
          </div>
        </div>

        {/* Apps List */}
        <div className="space-y-4 mb-8">
          {(selectedWeek === "all"
            ? getAppRanking(filteredApps)
            : filteredApps
          ).map((app) => {
            // For individual weeks, use position; for "all" view, use displayRank
            const rank =
              selectedWeek === "all" ? app.displayRank : app.position;
            const isTopThree = rank <= 3;

            return (
              <Link
                key={`${app.id}-${app.week_start || "all"}`}
                to={`/app/${app.id}`}
                className="block group"
              >
                <div
                  className={`w-full bg-white rounded-xl border flex flex-col sm:flex-row items-start sm:items-center p-3 md:p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5 
                    ${rank === 1 ? "border-gray-900" : ""}
                    ${rank === 2 ? "border-gray-600" : ""}
                    ${rank === 3 ? "border-gray-400" : ""}`}
                >
                  {/* Left: Position, Logo, Name, Description */}
                  <div className="flex items-start sm:items-center flex-1 min-w-0 gap-3 md:gap-4 w-full">
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <img
                        src={app.logo_url}
                        alt={app.name}
                        className="w-14 h-14 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate text-base md:text-lg">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isTopThree && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-normal
                                ${rank === 1 ? "bg-gray-900 text-white" : ""}
                                ${rank === 2 ? "bg-gray-300 text-gray-900" : ""}
                                ${rank === 3 ? "bg-gray-200 text-gray-900" : ""}
                              `}
                            >
                              <img
                                src={crownIcon}
                                alt="Badge"
                                className={`w-3 md:w-4 mr-0.5
                                  ${rank === 1 ? "inline" : ""}
                                  ${rank === 2 ? "hidden" : ""}
                                  ${rank === 3 ? "hidden" : ""}
                                `}
                              />

                              <img
                                src={crownBlackIcon}
                                alt="Badge"
                                className={`w-3 md:w-4 mr-0.5
                                  ${rank === 1 ? "hidden" : ""}
                                  ${rank === 2 ? "inline" : ""}
                                  ${rank === 3 ? "inline" : ""}
                                `}
                              />

                              {rank === 1 && "1st"}
                              {rank === 2 && "2nd"}
                              {rank === 3 && "3rd"}
                            </span>
                          )}
                          {app.is_paid && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2 mt-1 mb-2">
                        {app.short_description}
                      </p>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2 mb-3 sm:mb-0">
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
                  <div className="flex flex-row items-center gap-3 md:gap-4 ml-0 sm:ml-4 self-end sm:self-center mt-2 sm:mt-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rel =
                          isTopThree || app.is_paid ? "dofollow" : "nofollow";
                        window.open(
                          app.website_url,
                          "_blank",
                          rel === "dofollow" ? "" : "nofollow"
                        );
                      }}
                      className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <div className="inline-flex items-center gap-1.5 px-2.5 md:px-3.5 py-2 md:py-2.5 rounded-lg min-w-16 md:min-w-20 text-sm md:text-md font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex-shrink-0">
                      <ThumbsUp className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
                      <span>{app.vote_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Call to Action */}
        <Card className="bg-black text-white">
          <CardContent className="flex flex-col items-center text-center py-8 md:py-12 px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-medium mb-3 md:mb-4">
              Ready to Launch Your Travel App?
            </h2>
            <p className="text-white text-base md:text-lg mb-4 md:mb-6 max-w-lg">
              Join our weekly launches and showcase your app to the travel tech
              community
            </p>
            <Link to="/submit">
              <Button
                variant={"default"}
                className="bg-white text-black px-6 md:px-8 py-3 md:py-4 text-base md:text-lg"
              >
                Submit Your App
              </Button>
            </Link>
          </CardContent>
        </Card>

        {pastLaunches.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Past Launches Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Past launch weeks will appear here once they're completed.
              </p>
              <Link to="/">
                <Button>View Current Launch</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {filteredApps.length === 0 && pastLaunches.length > 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Apps Found
              </h3>
              <p className="text-gray-600 mb-4">
                No apps found for the selected time period.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="right-side w-full md:max-w-96 md:w-full md:sticky md:top-16 mt-6 md:mt-0 px-4 md:px-0">
        <aside className="space-y-6 md:space-y-8 py-4 md:py-8">
          <div className="flex flex-col items-start gap-3 md:gap-4">
            <h2 className="text-sm md:text-md font-medium text-gray-900 uppercase">
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
          <div className="flex flex-col items-start gap-3 md:gap-4">
            <h2 className="text-sm md:text-md font-medium text-gray-900 uppercase">
              Our partners
            </h2>
            <div className="flex flex-col gap-3 md:gap-4 w-full">
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
          <div className="flex flex-col items-center gap-3 md:gap-4">
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
