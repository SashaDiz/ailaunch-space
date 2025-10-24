"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ProductCard } from "./components/ProductCard";
import GuidePromoCard from "./components/GuidePromoCard";
import SponsorCard from "./components/SponsorCard";
import CountdownTimer from "./components/CountdownTimer";

// Import assets
import alexIcon from "/public/assets/alex-icon.png";
import codefastLogo from "/public/assets/codefa.st.png";
import datafastLogo from "/public/assets/datafa.st.png";
import { Rocket } from "iconoir-react";


function ProjectCard({ project, onVote }) {
  return <ProductCard project={project} onVote={onVote} />;
}

function RightSidePanel() {
  return (
    <div className="right-side w-full lg:max-w-96 lg:w-full lg:sticky lg:top-16 mt-6 lg:mt-0">
      <aside className="space-y-6 lg:space-y-8 py-4 lg:py-8">
        <div className="flex flex-col items-start gap-4">
          <GuidePromoCard
            imageSrc={alexIcon}
            name="Alexander Borisov"
            subtitle="Creator of AI Launch Space"
            title="Hey there!"
            description="I'm an aspiring solopreneur building my first startups with AI. 🚀
Follow my journey as I share lessons, wins, and experiments along the way!"
            buttonText="Follow me on X"
            buttonLink="https://x.com/alexanderOsso"
          />
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-sm lg:text-md font-medium text-gray-900 uppercase">
            Secret weapons
          </h2>
          <div className="flex flex-col gap-4 w-full">
            <SponsorCard
              sponsor={{
                logo: codefastLogo,
                name: "Codefa.st",
                description:
                  "This course by Marc Lou helped me to build this launchpad. I strongly recommend it for begginers.",
                url: "https://codefa.st/?via=ailaunch",
              }}
            />
            <SponsorCard
              sponsor={{
                logo: datafastLogo,
                name: "Datafa.st",
                description:
                  "Beautiful and useful analytics tool for your projects. Great for tracking your growth and performance.",
                url: "https://datafa.st/?via=ailaunch",
              }}
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <a href="https://frogdr.com/ailaunch.space?utm_source=ailaunch.space" target="_blank">
            <img
              src="https://frogdr.com/ailaunch.space/badge-white.svg"
              alt="Monitor your Domain Rating with FrogDR"
              width="200"
              height="43"
              className="w-full max-w-[200px] h-auto"
            />
          </a>
        </div>
      </aside>
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Schema.org structured data for the homepage
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ailaunch.space";

  const homepageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "AI Launch Space - Weekly Competition Platform for AI Projects",
    "description": "Submit your AI project to the weekly competition and get high authority backlinks. Join the community of successful AI builders and innovators.",
    "url": baseUrl,
    "mainEntity": {
      "@type": "Organization",
      "name": "AI Launch Space",
      "description": "Weekly Competition Platform for AI Projects",
      "url": baseUrl,
      "logo": `${baseUrl}/assets/logo.svg`
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        }
      ]
    }
  };

  // Animation refs
  const heroRef = useRef(null);
  const mainContentRef = useRef(null);
  const sidebarRef = useRef(null);
  const projectsRef = useRef(null);
  const featuredRef = useRef(null);

  // Fetch projects and competition data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize animations on mount
  useEffect(() => {
    if (!isClient) return;

    const tl = gsap.timeline();

    // Set initial states for sections - only if refs exist
    const refs = [
      heroRef.current,
      mainContentRef.current,
      sidebarRef.current,
      featuredRef.current,
    ].filter(Boolean); // Filter out null refs

    if (refs.length > 0) {
      gsap.set(refs, {
        opacity: 0,
        y: 30,
      });
    }

    // Animate sections with staggered delays for smooth entrance
    if (heroRef.current) {
      tl.to(heroRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }

    if (mainContentRef.current) {
      tl.to(
        mainContentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      ); // Start 0.6s before previous animation ends
    }

    if (sidebarRef.current) {
      tl.to(
        sidebarRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.4"
      ); // Start 0.4s before previous animation ends
    }

    if (featuredRef.current) {
      tl.to(
        featuredRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      ); // Start 0.6s before previous animation ends
    }
  }, [isClient]);

  // Animate projects when they change
  useEffect(() => {
    if (isClient && projectsRef.current && !loading && projects.length > 0) {
      const cards = projectsRef.current.children;
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
  }, [isClient, projects, loading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch projects for current weekly competition
      const projectsResponse = await fetch(
        `/api/projects?competition=weekly&limit=15&sort=upvotes`
      );
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data.projects || []);
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
      setProjects([]);
      setCompetition(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    // The actual voting is handled in the ProjectCard component
    // This function is kept for compatibility
  };

  return (
    <div className="relative">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageSchema),
        }}
      />
      {/* Decorative asymmetric blob with dramatic morphing - only on main page */}
      <div className="decorative-blob" aria-hidden="true"></div>
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Hero Header */}
            <section
              ref={heroRef}
              className="text-center lg:text-left pt-4 sm:pt-8 pb-4 sm:pb-8 max-w-xl lg:mr-auto"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight font-semibold text-gray-900 mb-4">
                Launch Your AI Project &amp;&nbsp;Get Discovered
              </h1>
              <p className="text-base sm:text-lg font-normal text-gray-900 mb-4 sm:mb-6 max-w-xl mx-auto lg:mx-0">
                Submit your AI project and get early exposure, reach other AI builders and innovators, and showcase your innovation to the community.
              </p>
            </section>

            {/* Best Weekly Products Section */}
            <section ref={mainContentRef}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium text-gray-900">
                    Best Weekly Products
                  </h2>
                  {/* Stats */}
                  <div className="p-2 px-4 rounded-xl bg-gray-100 text-center">
                    <p className="text-sm font-semibold text-base-content/60">
                      {projects.length} / 15 Apps
                    </p>
                  </div>
                </div>

                <CountdownTimer competitionData={competition} />
              </div>

              {/* Project Listings */}
              {loading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[...Array(6)].map((_, i) => (
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
              ) : projects.length > 0 ? (
                <div ref={projectsRef} className="grid grid-cols-1 gap-4">
                  {projects.map((project) => (
                    <ProductCard
                      key={project.id}
                      project={project}
                      onVote={handleVote}
                      viewMode="auto"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-12 gap-6">
                  <Rocket className="w-12 h-12 text-gray-600" strokeWidth={1} />
                  <p className="text-gray-700 text-md font-medium">No AI projects found for this competition.</p>
                  <Link
                    href="/submit?plan=standard"
                    className="block text-center bg-white text-gray-900 border border-gray-200 rounded-lg py-3 font-semibold text-sm no-underline transition duration-300 outline outline-4 outline-transparent hover:border-[#ED0D79] hover:bg-[#ED0D79] hover:text-white hover:outline-[#ed0d7924] min-h-[48px] min-w-[200px]"
                    aria-label="Submit your AI project to be the first in this competition"
                  >
                    Be the first to submit!
                  </Link>
                </div>
              )}
            </section>

            {/* Featured Section */}

            <section ref={featuredRef} className="mt-8 sm:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-center lg:text-left">Featured on</h2>
              <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-2 opacity-60">
                <li>
                  <a href="https://launchigniter.com/product/ai-launch-space?ref=badge-ai-launch-space" target="_blank">
                    <img src="https://launchigniter.com/api/badge/ai-launch-space?theme=neutral" alt="Featured on LaunchIgniter" width="140" height="32" />
                  </a>
                </li>
                <li>
                  <a href="https://auraplusplus.com/projects/ai-launch-space" target="_blank" rel="noopener">
                    <img src="https://auraplusplus.com/images/badges/featured-on-light.svg" alt="Featured on Aura++" width="120" height="24" />
                  </a>
                </li>
                <li>
                  <a href="https://turbo0.com/item/ai-launch-space" target="_blank" rel="noopener noreferrer">
                    <img src="https://img.turbo0.com/badge-listed-light.svg" alt="Listed on Turbo0" width="110" height="22" />
                  </a>
                </li>
                <li>
                  <a href="https://fazier.com/launches/www.ailaunch.space" target="_blank">
                    <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral" width="160" height="32" alt="Fazier badge" />
                  </a>
                </li>
                <li>
                  <a href="https://launchboard.dev" target="_blank" rel="noopener noreferrer">
                    <img src="https://launchboard.dev/launchboard-badge.png" alt="Launched on LaunchBoard - Product Launch Platform" width="90" height="24" />
                  </a>
                </li>
              </ul>
            </section>
          </div>

          {/* Right Sidebar */}
          <div ref={sidebarRef} className="lg:col-span-1">
            <RightSidePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
