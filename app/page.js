"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ProductCard } from "./components/ProductCard";
import GuidePromoCard from "./components/GuidePromoCard";
import SponsorCard from "./components/SponsorCard";

// Import assets
import johnIcon from "/public/assets/john.svg";
import backlinksListLogo from "/public/assets/backlinkslist-logo.svg";
import { Rocket } from "iconoir-react";

function CountdownTimer({ competitionData }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);

  // Calculate time remaining
  const calculateTimeLeft = () => {
    if (!endTimeRef.current) return null;

    const now = new Date().getTime();
    const difference = endTimeRef.current - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      totalMs: difference,
    };
  };

  // Initialize the countdown with competition data
  useEffect(() => {
    if (!competitionData?.end_date) return;

    // Set the end time reference
    endTimeRef.current = new Date(competitionData.end_date).getTime();

    // Calculate initial time
    const initial = calculateTimeLeft();
    if (initial) {
      setTimeLeft(initial);
      setIsExpired(initial.totalMs <= 0);
    }
  }, [competitionData]);

  // Update countdown every second
  useEffect(() => {
    if (!endTimeRef.current) return;

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
        if (newTimeLeft.totalMs <= 0) {
          setIsExpired(true);
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-row items-center justify-between p-6 bg-gray-100 rounded-2xl mb-8">
      <div>
        <h2 className="text-xl font-medium mb-1 text-base-content/80">
          {isExpired
            ? "Competition ended"
            : competitionData &&
              new Date(competitionData.start_date) > new Date()
              ? "Next launch in"
              : "New launches in"}
        </h2>
        <p className="text-sm text-base-content/60">
          Top 3 weekly products win badges and get dofollow backlinks.{" "}
          <Link href="/about" className="link link-primary">
            More details.
          </Link>
        </p>
      </div>
      <div
        ref={timerRef}
        className="flex justify-center items-center space-x-2 countdown-timer"
      >
        {isExpired ? (
          <div className="text-center">
            <div className="text-lg font-medium text-base-content/60">
              Competition Ended
            </div>
            <div className="text-xs text-base-content/50">
              Winners will be announced soon
            </div>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-xl font-semibold timer-digit">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">days</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold timer-digit">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">hours</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold timer-digit">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">mins</div>
            </div>
            <span className="text-xl font-semibold text-base-content/40">
              :
            </span>
            <div className="text-center">
              <div className="text-xl font-semibold timer-digit">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-xs text-base-content/60">secs</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DirectoryCard({ directory, onVote }) {
  return <ProductCard directory={directory} onVote={onVote} />;
}

function RightSidePanel() {
  return (
    <div className="right-side w-full md:max-w-96 md:w-full md:sticky md:top-16 mt-10 md:mt-0">
      <aside className="space-y-8 py-8 md:py-8">
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-md font-medium text-gray-900 uppercase">
            AI Builder Resources
          </h2>
          <GuidePromoCard
            imageSrc={johnIcon}
            name="John Rush"
            subtitle="Creator of MarsX (uniting AI, NoCode, and Code)"
            title="Want to build your own AI project?"
            description="Learn everything you need to launch successful AI tools and get traction in the growing AI market."
            buttonText="Get AI Launch Guide Now"
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
          <a href="https://frogdr.com/ailaunch.space?utm_source=ailaunch.space" target="_blank">
            <img src="https://frogdr.com/ailaunch.space/badge-white.svg" alt="Monitor your Domain Rating with FrogDR" width="250" height="54" />
          </a>
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);

  // Animation refs
  const heroRef = useRef(null);
  const mainContentRef = useRef(null);
  const sidebarRef = useRef(null);
  const directoriesRef = useRef(null);
  const featuredRef = useRef(null);

  // Fetch directories and competition data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Initialize animations on mount
  useEffect(() => {
    const tl = gsap.timeline();

    // Set initial states for sections
    gsap.set(
      [
        heroRef.current,
        mainContentRef.current,
        sidebarRef.current,
        featuredRef.current,
      ],
      {
        opacity: 0,
        y: 30,
      }
    );

    // Animate sections with staggered delays for smooth entrance
    tl.to(heroRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
    })
      .to(
        mainContentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      ) // Start 0.6s before previous animation ends
      .to(
        sidebarRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.4"
      ) // Start 0.4s before previous animation ends
      .to(
        featuredRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      ); // Start 0.6s before previous animation ends
  }, []);

  // Animate directories when they change
  useEffect(() => {
    if (directoriesRef.current && !loading && directories.length > 0) {
      const cards = directoriesRef.current.children;
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 20,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
        }
      );
    }
  }, [directories, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch directories for current weekly competition
      const directoriesResponse = await fetch(
        `/api/directories?competition=weekly&limit=15&sort=upvotes`
      );
      if (directoriesResponse.ok) {
        const directoriesData = await directoriesResponse.json();
        setDirectories(directoriesData.data.directories || []);
      }

      // Fetch current competition data
      const competitionsResponse = await fetch(
        "/api/competitions?current=true"
      );
      if (competitionsResponse.ok) {
        const competitionsData = await competitionsResponse.json();
        const weeklyComp = competitionsData.data.competitions.find(
          (c) => c.type === "weekly"
        );
        setCompetition(weeklyComp || null);
      }
    } catch (error) {
      console.error("Failed to fetch homepage data:", error);
      // Fallback to empty state
      setDirectories([]);
      setCompetition(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    // The actual voting is handled in the DirectoryCard component
    // This function is kept for compatibility
  };

  return (
    <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Hero Header */}
          <section
            ref={heroRef}
            className="text-center pt-8 pb-8 max-w-3xl mr-auto"
          >
            <h1 className="text-6xl font-semibold text-gray-900 mb-6 text-left">
              Launch Your AI Project &amp;&nbsp;Get a&nbsp;DR22+ Backlink
            </h1>
            <p className="text-xl font-normal text-gray-900 text-left mb-6 max-w-xl">
              Submit your AI project and get a&nbsp;DR22&nbsp;backlink, early
              exposure, and reach other AI builders and innovators.
            </p>
          </section>

          {/* Best Weekly Products Section */}
          <section ref={mainContentRef}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-medium text-gray-900">
                  Best Weekly Products
                </h2>
                {/* Stats */}
                <div className="p-2 px-4 rounded-xl bg-gray-100 text-center">
                  <p className="text-sm font-semibold text-base-content/60">
                    {directories.length} / 15 Apps
                  </p>
                </div>
              </div>

              <CountdownTimer competitionData={competition} />
            </div>

            {/* Directory Listings */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-base-100 rounded-lg p-4 border border-base-300"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="skeleton w-12 h-12 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-3/4"></div>
                        <div className="skeleton h-3 w-full"></div>
                        <div className="skeleton h-3 w-1/2"></div>
                      </div>
                      <div className="skeleton w-16 h-16 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : directories.length > 0 ? (
              <div ref={directoriesRef} className="space-y-4">
                {directories.map((directory) => (
                  <DirectoryCard
                    key={directory.id}
                    directory={directory}
                    onVote={handleVote}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-12 gap-6">
                <Rocket className="w-12 h-12" strokeWidth={1.5} />
                <p>No AI projects found for this competition.</p>
                <Link href="/submit" className="btn btn-primary">
                  Be the first to submit!
                </Link>
              </div>
            )}
          </section>

          {/* Featured Section */}
          <section ref={featuredRef} className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Featured on</h2>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
              {/* Partner logos */}
              <div className="flex items-center space-x-2 hover:opacity-100 duration-300 cursor-pointer transform hover:scale-105 transition-transform">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-sm font-medium">Startup Flame</span>
              </div>
              <div className="flex items-center space-x-2 hover:opacity-100 duration-300 cursor-pointer transform hover:scale-105 transition-transform">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                <span className="text-sm font-medium">Yo.directory</span>
              </div>
              <div className="flex items-center space-x-2 hover:opacity-100 duration-300 cursor-pointer transform hover:scale-105 transition-transform">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-sm font-medium">Twelve.tools</span>
              </div>
              <div className="flex items-center space-x-2 hover:opacity-100 duration-300 cursor-pointer transform hover:scale-105 transition-transform">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium">LaunchBoard.dev</span>
              </div>
              <div className="flex items-center space-x-2 hover:opacity-100 duration-300 cursor-pointer transform hover:scale-105 transition-transform">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium">Faster.com</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div ref={sidebarRef} className="lg:col-span-1">
          <RightSidePanel />
        </div>
      </div>
    </div>
  );
}
