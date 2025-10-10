"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  OpenNewWindow,
  CheckCircle,
  NavArrowLeft,
  Group,
  Medal,
} from "iconoir-react";
import toast from "react-hot-toast";
import { SocialShare } from "../../components/SocialShare";
import { CategoryBadge, PricingBadge } from "../../components/CategoryBadge";

function DirectoryDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { slug } = params;
  const submitted = searchParams.get("submitted") === "true";

  const [directory, setDirectory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (slug) {
      fetchDirectory();
    }
  }, [slug]);

  useEffect(() => {
    if (submitted) {
      toast.success(
        "🎉 AI project submitted successfully! Your project is now live and competing in this week's launch.",
        {
          duration: 5000,
        }
      );
    }
  }, [submitted]);

  const fetchDirectory = async () => {
    // Prevent duplicate calls (helpful in development with StrictMode)
    if (fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      setLoading(true);
      const response = await fetch(`/api/directories/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setDirectory(data.data.directory);
      } else {
        toast.error("Directory not found");
      }
    } catch (error) {
      console.error("Failed to fetch directory:", error);
      toast.error("Failed to load directory");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleVote = async () => {
    if (!directory) return;

    setIsVoting(true);
    try {
      const action = directory.userVoted ? "remove" : "upvote";
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: directory.id,
          action,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDirectory((prev) => ({
          ...prev,
          upvotes: data.data.newVoteCount,
          userVoted: data.data.userVoted,
        }));
        toast.success(directory.userVoted ? "Vote removed!" : "Vote added!");
      } else {
        const error = await response.json();
        if (error.code === "UNAUTHORIZED") {
          toast.error("Please sign in to vote");
        } else {
          toast.error(error.message || "Failed to vote");
        }
      }
    } catch (error) {
      toast.error("Failed to vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  const handleVisitWebsite = async () => {
    // Track click analytics
    try {
      await fetch(`/api/directories/${directory.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  // Generate website link with ref parameter and proper rel attribute
  const getWebsiteLink = () => {
    if (!directory?.website_url) return { url: '#', rel: 'nofollow noopener noreferrer' };
    
    try {
      const url = new URL(directory.website_url);
      url.searchParams.set('ref', 'ailaunchspace');
      
      // Use link_type field from database
      const isDofollow = directory.link_type === "dofollow";
      
      return {
        url: url.toString(),
        rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
      };
    } catch (error) {
      return { url: directory.website_url, rel: 'nofollow noopener noreferrer' };
    }
  };

  const websiteLink = directory ? getWebsiteLink() : { url: '#', rel: 'nofollow noopener noreferrer' };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-base-300 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-base-300 rounded mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-base-300 rounded"></div>
                <div className="h-48 bg-base-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-base-300 rounded"></div>
                <div className="h-32 bg-base-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!directory) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Directory Not Found</h1>
            <p className="text-base-content/70 mb-6">
              The directory you're looking for doesn't exist or has been
              removed.
            </p>
            <Link href="/" className="btn btn-outline">
              <NavArrowLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="breadcrumbs text-sm mb-6">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <span className="text-base-content/60">{directory.name}</span>
            </li>
          </ul>
        </div>

        {/* Success Banner for Submitted Directories */}
        {submitted && (
          <div className="alert alert-success mb-8">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-medium">🎉 Submission Successful!</h3>
              <div className="text-sm">
                Your directory "{directory.name}" is now live and competing in
                this week's and month's competitions. Share it with your network
                to get more votes!
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="card rounded-xl border border-base-300 mb-8">
          <div className="card-body">
            <div className="flex flex-col justify-between lg:flex-row lg:items-start gap-6">
              {/* Logo and Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="avatar">
                  <div className="w-32 h-32 rounded-2xl border border-base-300">
                    <Image
                      src={directory.logo_url}
                      alt={`${directory.name} logo`}
                      width={80}
                      height={80}
                      className="rounded-2xl object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold">
                      {directory.name}
                    </h1>
                    {directory.premium_badge && (
                      <span className="badge badge-primary">Premium</span>
                    )}
                    {directory.status === "pending" && (
                      <span className="badge badge-warning">Under Review</span>
                    )}
                  </div>

                  <p className="text-base-content/70 text-md mb-4">
                    {directory.short_description}
                  </p>

                  {/* Categories and Pricing */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {directory.categories?.map((category) => (
                      <CategoryBadge
                        key={category}
                        category={category}
                        size="sm"
                      />
                    ))}
                    {directory.pricing && (
                      <PricingBadge pricing={directory.pricing} size="sm" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-end justify-between gap-4">
                <div className="flex gap-2 items-center justify-center">
                  <SocialShare
                    directoryId={directory.id}
                    slug={directory.slug}
                    title={directory.name}
                    description={directory.tagline || directory.description}
                    hashtags={[
                      directory.category
                        ? directory.category.replace(/[^a-zA-Z0-9]/g, "")
                        : "",
                      "AILaunchSpace",
                    ]}
                    className="inline"
                  />

                  <a
                    href={websiteLink.url}
                    target="_blank"
                    rel={websiteLink.rel}
                    onClick={handleVisitWebsite}
                    className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
                  >
                    <OpenNewWindow className="w-5 h-5" />
                  </a>
                </div>

                <button
                  onClick={handleVote}
                  disabled={isVoting}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-4 rounded-xl min-w-20 text-md font-semibold transition duration-300 ease-in-out -translate-y-0.5
                        ${
                          directory.userVoted
                            ? "bg-black text-white translate-0"
                            : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-black hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                        }
                        ${isVoting ? "cursor-default" : "cursor-pointer"}`}
                >
                  <svg
                    width="24px"
                    height="24px"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color={directory.userVoted ? "#ffffff" : "#000000"}
                  >
                    <path
                      d="M16.4724 20H4.1C3.76863 20 3.5 19.7314 3.5 19.4V9.6C3.5 9.26863 3.76863 9 4.1 9H6.86762C7.57015 9 8.22116 8.6314 8.5826 8.02899L11.293 3.51161C11.8779 2.53688 13.2554 2.44422 13.9655 3.33186C14.3002 3.75025 14.4081 4.30635 14.2541 4.81956L13.2317 8.22759C13.1162 8.61256 13.4045 9 13.8064 9H18.3815C19.7002 9 20.658 10.254 20.311 11.5262L18.4019 18.5262C18.1646 19.3964 17.3743 20 16.4724 20Z"
                      stroke={directory.userVoted ? "#ffffff" : "#000000"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    ></path>
                    <path
                      d="M7 20L7 9"
                      stroke={directory.userVoted ? "#ffffff" : "#000000"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  {isVoting ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm font-semibold">
                      {directory.upvotes}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Social Share - Only on larger screens */}
        <SocialShare
          directoryId={directory.id}
          slug={directory.slug}
          title={`🚀 Discover ${directory.name} - Featured AI Project on AI Launch Space`}
          description={directory.tagline || directory.description}
          hashtags={[
            directory.category
              ? directory.category.replace(/[^a-zA-Z0-9]/g, "")
              : "",
            "AILaunchSpace",
          ]}
          variant="floating"
          className="hidden lg:block"
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Screenshots */}
            {directory.screenshots && directory.screenshots.length > 0 && (
              <div className="card rounded-xl border border-base-300">
                <div className="card-body">
                  <h2 className="text-xl font-bold mb-4">Screenshots</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {directory.screenshots.map((screenshot, index) => (
                      <div
                        key={index}
                        className="aspect-video border border-base-300 rounded-lg overflow-hidden bg-base-50"
                      >
                        <Image
                          src={screenshot}
                          alt={`${directory.name} screenshot ${index + 1}`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(screenshot, "_blank")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Full Description */}
            {directory.full_description && (
              <div className="card rounded-xl border border-base-300">
                <div className="card-body">
                  <h2 className="text-xl font-bold mb-4">
                    About {directory.name}
                  </h2>
                  <div className="prose max-w-none">
                    <p className="text-base-content/80 leading-relaxed whitespace-pre-line">
                      {directory.full_description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Video */}
            {directory.video_url && (
              <div className="card rounded-xl border border-base-300">
                <div className="card-body">
                  <h2 className="text-xl font-bold mb-4">Demo Video</h2>
                  <div className="aspect-video">
                    <iframe
                      src={directory.video_url}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      title={`${directory.name} demo video`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Related Directories */}
            {directory.relatedDirectories &&
              directory.relatedDirectories.length > 0 && (
                <div className="card rounded-xl border border-base-300">
                  <div className="card-body">
                    <h2 className="text-xl font-bold mb-4">
                      Related Directories
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {directory.relatedDirectories.map((related) => (
                        <Link
                          key={related.id}
                          href={`/directory/${related.slug}`}
                          className="card rounded-xl card-compact bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="card-body">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-lg border border-base-300">
                                  <Image
                                    src={related.logo_url}
                                    alt={`${related.name} logo`}
                                    width={40}
                                    height={40}
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">
                                  {related.name}
                                </h3>
                                <div className="flex items-center space-x-2 text-xs text-base-content/60">
                                  <span>{related.upvotes} votes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Directory Info */}
            <div className="card rounded-xl border border-base-300">
              <div className="card-body">
                <h3 className="text-lg font-bold mb-4">Directory Details</h3>
                <div className="space-y-3 text-sm">
                  {directory.pricing && (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/60">Pricing:</span>
                      <PricingBadge
                        pricing={directory.pricing}
                        clickable={false}
                      />
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-base-content/60">Status:</span>
                    <span
                      className={`badge ${
                        directory.status === "live"
                          ? "badge-success"
                          : "badge-warning"
                      } badge-sm`}
                    >
                      {directory.status}
                    </span>
                  </div>

                  {directory.plan && (
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Plan:</span>
                      <span className="font-medium capitalize">
                        {directory.plan}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-base-content/60">Launch Date:</span>
                    <span className="font-medium">
                      {formatDate(directory.launch_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Views:</span>
                    <span className="font-medium">{directory.views}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Maker Info */}
            {(directory.maker_name || directory.maker_twitter) && (
              <div className="card rounded-xl border border-base-300">
                <div className="card-body">
                  <h3 className="text-lg font-bold mb-4">
                    <Group className="w-5 h-5 inline mr-2" />
                    Maker
                  </h3>
                  <div className="space-y-2">
                    {directory.maker_name && (
                      <div className="font-medium">{directory.maker_name}</div>
                    )}
                    {directory.maker_twitter && (
                      <div>
                        <a
                          href={`https://twitter.com/${directory.maker_twitter.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary text-sm"
                        >
                          {directory.maker_twitter}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Competition Status */}
            {directory.competitions && directory.competitions.length > 0 && (
              <div className="card rounded-xl border border-base-300">
                <div className="card-body">
                  <h3 className="text-lg font-bold mb-4">
                    <Medal className="w-5 h-5 inline mr-2" />
                    Competitions
                  </h3>
                  <div className="space-y-3">
                    {directory.competitions.map((competition) => (
                      <div
                        key={competition.competition_id}
                        className="border border-base-300 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium capitalize">
                            {competition.type}
                          </span>
                          <span
                            className={`badge ${
                              competition.status === "active"
                                ? "badge-success"
                                : "badge-neutral"
                            } badge-sm`}
                          >
                            {competition.status}
                          </span>
                        </div>
                        <div className="text-xs text-base-content/60">
                          {formatDate(competition.start_date)} -{" "}
                          {formatDate(competition.end_date)}
                        </div>
                        {competition.status === "active" && (
                          <div className="mt-2 text-xs">
                            <div className="text-primary font-medium">
                              Currently competing!
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DirectoryDetailPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">Loading directory...</p>
          </div>
        </div>
      }
    >
      <DirectoryDetailPageContent />
    </Suspense>
  );
}
