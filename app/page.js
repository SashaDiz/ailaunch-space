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
    <div className="right-side w-full md:max-w-96 md:w-full md:sticky md:top-16 mt-10 md:mt-0">
      <aside className="space-y-8 py-8 md:py-8">
        <div className="flex flex-col items-start gap-4">
          <GuidePromoCard
            imageSrc={alexIcon}
            name="Alexander Borisov"
            subtitle="Creator of AI Launch Space"
            title="Hey there!"
            description="I’m an aspiring solopreneur building my first startups with AI. 🚀
Follow my journey as I share lessons, wins, and experiments along the way!"
            buttonText="Follow me on X"
            buttonLink="https://x.com/alexanderOsso"
          />
        </div>
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-md font-medium text-gray-900 uppercase">
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
            <img src="https://frogdr.com/ailaunch.space/badge-white.svg" alt="Monitor your Domain Rating with FrogDR" width="250" height="54" />
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
      {/* Decorative asymmetric blob with dramatic morphing - only on main page */}
      <div className="decorative-blob" aria-hidden="true"></div>
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Hero Header */}
          <section
            ref={heroRef}
            className="text-center pt-8 pb-8 max-w-xl mr-auto"
          >
            <h1 className="text-5xl leading-tight font-semibold text-gray-900 mb-4 text-left">
              Launch Your AI Project &amp;&nbsp;Get Discovered
            </h1>
            <p className="text-lg font-normal text-gray-900 text-left mb-6 max-w-xl">
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
            ) : projects.length > 0 ? (
              <div ref={projectsRef} className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
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
    </div>
  );
}
