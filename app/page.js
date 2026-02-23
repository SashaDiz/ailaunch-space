"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ProductCard } from "./components/ProductCard";
import GuidePromoCard from "./components/GuidePromoCard";
import SponsorCard from "./components/SponsorCard";
import CountdownTimer from "./components/CountdownTimer";
import { AutoSubmitModal } from "./components/AutoSubmitModal";
import { VoteRequiredModal } from "./components/VoteRequiredModal";
import { StreakCard } from "./components/StreakCard";
import { UmamiStats } from "./components/UmamiStats";
import { useUser } from "./hooks/useUser";
import { useRouter } from "next/navigation";

import { Rocket, Send, PlusCircle } from "iconoir-react";

// Image paths - using static paths for Next.js Image component
const alexIcon = "/assets/alex-icon.png";
const codefastLogo = "/assets/codefa.st.png";
const datafastLogo = "/assets/datafa.st.png";


function ProjectCard({ project, onVote }) {
  return <ProductCard project={project} onVote={onVote} />;
}

function RightSidePanel() {
  return (
    <div className="right-side w-full lg:max-w-none lg:w-full lg:sticky lg:top-16 mt-6 lg:mt-0">
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

function LeftSidePanel() {
  return (
    <div className="left-side w-full lg:max-w-none lg:w-full lg:sticky lg:top-16 mt-6 lg:mt-0">
      <aside className="space-y-6 lg:space-y-6 xl:space-y-8 py-4 lg:py-6 xl:py-8">
        <UmamiStats />
        <div className="flex flex-col gap-4">
          <h2 className="text-sm lg:text-base xl:text-lg font-medium text-gray-900 uppercase">
            Your Streak
          </h2>
          <StreakCard />
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
  const [isAutoSubmitModalOpen, setIsAutoSubmitModalOpen] = useState(false);
  const [isVoteRequiredModalOpen, setIsVoteRequiredModalOpen] = useState(false);
  const [checkingVote, setCheckingVote] = useState(false);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

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
  const hasFetchedRef = useRef(false);

  // Fetch projects and competition data on mount (only once)
  useEffect(() => {
    // Prevent refetching when switching tabs/windows
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchData();
  }, []);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if modal should be shown automatically (once per day)
  useEffect(() => {
    if (!isClient) return;

    const checkAndShowModal = () => {
      const storageKey = "autoSubmitModalLastShown";
      const lastShownDate = localStorage.getItem(storageKey);
      const today = new Date().toDateString(); // e.g., "Mon Jan 15 2024"

      // If never shown or last shown on a different day, show the modal
      if (!lastShownDate || lastShownDate !== today) {
        setIsAutoSubmitModalOpen(true);
      }
    };

    checkAndShowModal();
  }, [isClient]);

  // Listen for vote success events - close vote required modal if open
  useEffect(() => {
    if (!isClient) return;

    const handleVoteSuccess = async () => {
      if (isVoteRequiredModalOpen) {
        // User just voted - close the modal
        setIsVoteRequiredModalOpen(false);
      }
    };

    window.addEventListener('voteSuccess', handleVoteSuccess);
    return () => {
      window.removeEventListener('voteSuccess', handleVoteSuccess);
    };
  }, [isClient, isVoteRequiredModalOpen]);

  // Save the date when modal is closed
  const handleModalClose = () => {
    const storageKey = "autoSubmitModalLastShown";
    const today = new Date().toDateString();
    localStorage.setItem(storageKey, today);
    setIsAutoSubmitModalOpen(false);
  };

  // Handle Launch Project button click - check vote status
  const handleLaunchProject = async (e) => {
    e.preventDefault();
    
    // If user is not authenticated, let them navigate normally
    // The submit page will handle authentication
    if (!user) {
      router.push('/submit');
      return;
    }

    // Check if user has voted today
    setCheckingVote(true);
    try {
      const response = await fetch('/api/vote/check-today', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.authenticated && !data.hasVotedToday) {
        // User hasn't voted today - show modal
        setIsVoteRequiredModalOpen(true);
      } else {
        // User has voted or there was an error - allow navigation
        router.push('/submit');
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
      // On error, allow navigation to avoid blocking users
      router.push('/submit');
    } finally {
      setCheckingVote(false);
    }
  };

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
      <div className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-12 xl:grid-cols-4 gap-6 lg:gap-6 xl:gap-8">
          {/* Left Sidebar - Streak Card */}
          <div className="lg:col-span-3 xl:col-span-1">
            <LeftSidePanel />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6 xl:col-span-2 w-full max-w-full overflow-x-hidden">
            {/* Hero Header */}
            <section
              ref={heroRef}
              className="text-center lg:text-left pt-4 sm:pt-8 pb-4 sm:pb-8 w-full lg:max-w-xl xl:max-w-xl"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight font-semibold text-gray-900 mb-4">
                Launch Your AI Project &amp;&nbsp;Get Discovered
              </h1>
              <p className="text-base sm:text-lg font-normal text-gray-900 mb-4 sm:mb-6 w-full lg:max-w-xl mx-auto lg:mx-0">
                Submit your AI project and get early exposure, reach other AI builders and innovators, and showcase your innovation to the community.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                <button
                  onClick={handleLaunchProject}
                  disabled={checkingVote}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white border-2 border-black rounded-lg font-semibold text-xs no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black min-h-[48px] w-full sm:w-auto sm:min-w-[200px] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  aria-label="Launch your AI project"
                >
                  <PlusCircle 
                    className="h-4 w-4"
                    strokeWidth={2}
                  />
                  {checkingVote ? 'Checking...' : 'Launch a Project'}
                </button>
                <button
                  onClick={() => setIsAutoSubmitModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 rounded-lg font-semibold text-xs no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 min-h-[48px] w-full sm:w-auto sm:min-w-[200px] uppercase"
                  aria-label="Learn about auto submit service"
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                  Auto submit
                </button>
              </div>
            </section>

            {/* Best Weekly Products Section */}
            <section ref={mainContentRef} id="projects-section">
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
              <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <li>
                  <a href="https://launchigniter.com/product/ai-launch-space?ref=badge-ai-launch-space" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/lignighter.svg" alt="Featured on LaunchIgniter" width="24" height="24" />
                      <span className="text-sm font-medium">LaunchIgniter</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://auraplusplus.com/projects/ai-launch-space" target="_blank" rel="noopener">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/aura.png" alt="Featured on Aura++" width="24" height="24" />
                      <span className="text-sm font-medium">Aura++</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://turbo0.com/item/ai-launch-space" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/turbo.png" alt="Listed on Turbo0" width="24" height="24" />
                      <span className="text-sm font-medium">Turbo0</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://fazier.com/launches/www.ailaunch.space" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/fazier.png" alt="Featured on Fazier" width="24" height="24" />
                      <span className="text-sm font-medium">Fazier</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://launchboard.dev" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/lboard.svg" alt="Launched on LaunchBoard - Product Launch Platform" width="24" height="24" />
                      <span className="text-sm font-medium">LaunchBoard</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://twelve.tools" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/twelve.svg" alt="Featured on Twelve Tools" width="24" height="24" />
                      <span className="text-sm font-medium">Twelve Tools</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://uno.directory" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/uno.svg" alt="Uno Directory" width="24" height="24" />
                      <span className="text-sm font-medium">Uno Directory</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://yo.directory/" target="_blank" >
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/yo.svg" alt="yo.directory" width="24" height="24" />
                      <span className="text-sm font-medium">yo.directory</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://www.aidirectori.es" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/aidirectory.png" alt="AI Directories Badge" width="24" height="24" />
                      <span className="text-sm font-medium">AI Directories</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://startupfa.me/s/ailaunch.space?utm_source=www.ailaunch.space" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/startupfame.svg" alt="AI Launch Space - Featured on Startup Fame" width="24" height="24" />
                      <span className="text-sm font-medium">Startup Fame</span>
                    </div>
                  </a>
                </li>
                <li>
                <a href="https://launch-list.org/product/ai-launch-space" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/launch-list.png" alt="Featured on Launch List" width="24" height="24" />
                      <span className="text-sm font-medium">Launch List</span>
                    </div>
                  </a>
                </li>
                <li>
                <a href="https://directoryhunt.org/?ref=ailaunch.space" target="_blank">
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg p-2 border border-gray-200 hover:border-[#ED0D79] hover:scale-105 transition-transform duration-200">
                      <img src="/assets/directoryhunt.png" alt="Featured on DirectoryHunt.org" width="24" height="24" />
                      <span className="text-sm font-medium">DirectoryHunt</span>
                    </div>
                  </a>
                </li>  
              </ul>
            </section>
          </div>

          {/* Right Sidebar */}
          <div ref={sidebarRef} className="lg:col-span-3 xl:col-span-1">
            <RightSidePanel />
          </div>
        </div>
      </div>
      
      {/* Auto Submit Modal */}
      <AutoSubmitModal
        isOpen={isAutoSubmitModalOpen}
        onClose={handleModalClose}
      />
      
      {/* Vote Required Modal */}
      <VoteRequiredModal
        isOpen={isVoteRequiredModalOpen}
        onClose={() => setIsVoteRequiredModalOpen(false)}
      />
    </div>
  );
}
