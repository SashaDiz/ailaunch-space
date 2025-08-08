import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  ThumbsUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryPricingBadge } from "@/components/ui/CategoryPricingBadge";
import GuidePromoCard from "@/components/ui/GuidePromoCard";
import SponsorCard from "@/components/ui/SponsorCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import johnIcon from "@/assets/john.svg";
import crownIcon from "@/assets/crown.svg";
import crownBlackIcon from "@/assets/crown-black.svg";
import backlinksListLogo from "@/assets/backlinkslist-logo.svg";

// Placeholder for authentication state
const isAuthenticated = false; // Replace with AuthJS logic

export function AppDetailPage() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relatedApps, setRelatedApps] = useState([]);
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [modalMediaItems, setModalMediaItems] = useState([]);

  // Mock data for development
  useEffect(() => {
    setTimeout(() => {
      const currentApp = {
        id: parseInt(id),
        name: "TravelMate Navigator",
        short_description:
          "AI-powered travel planning with real-time updates and local insights",
        full_description:
          "TravelMate Navigator is a comprehensive travel planning application that leverages artificial intelligence to provide personalized travel recommendations, real-time updates, and local insights. Whether you're planning a weekend getaway or a month-long adventure, our app helps you discover hidden gems, find the best deals, and navigate like a local.\n\nKey features include:\n• AI-powered itinerary planning\n• Real-time flight and accommodation updates\n• Local insider recommendations\n• Offline maps and navigation\n• Multi-language support\n• Social sharing and collaboration tools",
        logo_url: "https://picsum.photos/120/120?random=1",
        screenshots: [
          "https://picsum.photos/400/600?random=2",
          "https://picsum.photos/400/600?random=3",
          "https://picsum.photos/400/600?random=4",
        ],
        video_url: "https://www.youtube.com/embed/jNQXAC9IVRw",
        website_url: "https://example.com",
        vote_count: 42,
        is_paid: false,
        is_winner: false,
        is_active: false, // Not active - finished launch, shows ranking
        ranking: 2, // 1, 2, 3 for winners, null for others
        launch_week_start: "2025-06-16T00:00:00Z",
        created_at: "2025-06-16T10:30:00Z",
        categories: ["AI & LLM", "Developer Tools & Platforms"],
        pricing: "Freemium",
      };

      // Mock related apps with shared categories
      const mockRelatedApps = [
        {
          id: 201,
          name: "CodeGen AI",
          short_description: "AI-powered code generation for developers",
          logo_url: "https://picsum.photos/60/60?random=5",
          vote_count: 128,
          categories: ["AI & LLM", "Developer Tools & Platforms"],
          pricing: "Paid",
          ranking: 1,
          website_url: "https://example.com/codegen",
        },
        {
          id: 202,
          name: "DevOps Central",
          short_description: "Complete DevOps platform for modern teams",
          logo_url: "https://picsum.photos/60/60?random=6",
          vote_count: 95,
          categories: ["Developer Tools & Platforms"],
          pricing: "Freemium",
          ranking: null,
          website_url: "https://example.com/devops",
        },
        {
          id: 203,
          name: "SmartChat Bot",
          short_description: "Intelligent chatbot powered by advanced AI",
          logo_url: "https://picsum.photos/60/60?random=7",
          vote_count: 87,
          categories: ["AI & LLM"],
          pricing: "Free",
          ranking: 3,
          website_url: "https://example.com/smartchat",
        },
        {
          id: 204,
          name: "API Gateway Pro",
          short_description: "Enterprise-grade API management solution",
          logo_url: "https://picsum.photos/60/60?random=8",
          vote_count: 76,
          categories: ["Developer Tools & Platforms", "APIs & Integrations"],
          pricing: "Paid",
          ranking: null,
          website_url: "https://example.com/apigateway",
        },
        {
          id: 205,
          name: "AI Content Writer",
          short_description: "Generate high-quality content with AI assistance",
          logo_url: "https://picsum.photos/60/60?random=9",
          vote_count: 112,
          categories: ["AI & LLM", "Content & Marketing"],
          pricing: "Freemium",
          ranking: 2,
          website_url: "https://example.com/aiwriter",
        },
        {
          id: 206,
          name: "Cloud Deploy",
          short_description: "Simplified cloud deployment for any application",
          logo_url: "https://picsum.photos/60/60?random=10",
          vote_count: 64,
          categories: ["Developer Tools & Platforms"],
          pricing: "Free",
          ranking: null,
          website_url: "https://example.com/clouddeploy",
        },
        {
          id: 207,
          name: "ML Pipeline Builder",
          short_description:
            "Build and deploy machine learning pipelines easily",
          logo_url: "https://picsum.photos/60/60?random=11",
          vote_count: 89,
          categories: ["AI & LLM", "Developer Tools & Platforms"],
          pricing: "Paid",
          ranking: null,
          website_url: "https://example.com/mlpipeline",
        },
        {
          id: 208,
          name: "Voice AI Assistant",
          short_description:
            "Create custom voice assistants with natural language",
          logo_url: "https://picsum.photos/60/60?random=12",
          vote_count: 103,
          categories: ["AI & LLM"],
          pricing: "Freemium",
          ranking: 1,
          website_url: "https://example.com/voiceai",
        },
        {
          id: 209,
          name: "Debug Master",
          short_description:
            "Advanced debugging tools for complex applications",
          logo_url: "https://picsum.photos/60/60?random=13",
          vote_count: 71,
          categories: ["Developer Tools & Platforms"],
          pricing: "Paid",
          ranking: null,
          website_url: "https://example.com/debugmaster",
        },
        {
          id: 210,
          name: "Neural Networks Kit",
          short_description: "Complete toolkit for building neural networks",
          logo_url: "https://picsum.photos/60/60?random=14",
          vote_count: 156,
          categories: ["AI & LLM", "Machine Learning"],
          pricing: "Free",
          ranking: 3,
          website_url: "https://example.com/neuralkit",
        },
      ];

      setApp(currentApp);
      setRelatedApps(mockRelatedApps);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleVote = async () => {
    if (!isAuthenticated) {
      window.location.href = "/signin";
      return;
    }
    if (!app?.is_active) return;

    setVotingLoading(true);
    setApp((prev) => ({
      ...prev,
      vote_count: hasVoted ? prev.vote_count - 1 : prev.vote_count + 1,
    }));
    setHasVoted((prev) => !prev);
    setVotingLoading(false);
  };

  const openModal = (index, mediaItems) => {
    setModalMediaItems(mediaItems);
    setModalIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const navigateModal = (direction) => {
    if (direction === "prev" && modalIndex > 0) {
      setModalIndex(modalIndex - 1);
    } else if (
      direction === "next" &&
      modalIndex < modalMediaItems.length - 1
    ) {
      setModalIndex(modalIndex + 1);
    }
  };

  // Create media items array for modal
  const getMediaItems = (app) => {
    const items = [];
    if (app.video_url) {
      items.push({ type: "video", src: app.video_url, alt: "Product Video" });
    }
    if (app.screenshots?.length > 0) {
      app.screenshots.forEach((screenshot, index) => {
        items.push({
          type: "image",
          src: screenshot,
          alt: `Screenshot ${index + 1}`,
        });
      });
    }
    return items;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">App Not Found</h1>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start md:flex-row gap-10 space-y-0">
      <div className="left-side w-full space-y-8 py-8 md:flex-1">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-gray-900 group">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="transition duration-300 group-hover:-translate-x-1">
            Back to Launch
          </span>
        </Link>

        {/* App Header */}
        <div className="">
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={app.logo_url}
              alt={app.name}
              className="w-24 h-24 rounded-xl object-cover mx-auto md:mx-0"
            />

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h2 className="text-3xl font-medium text-gray-900">
                  {app.name}
                </h2>
                {app.is_paid && (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                    Premium
                  </Badge>
                )}
                {app.ranking && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-normal
                    ${app.ranking === 1 ? "bg-gray-900 text-white" : ""}
                    ${app.ranking === 2 ? "bg-gray-300 text-gray-900" : ""}
                    ${app.ranking === 3 ? "bg-gray-200 text-gray-900" : ""}
                  `}
                  >
                    <img
                      src={crownIcon}
                      alt="Badge"
                      className={`w-4 mr-0.5
                      ${app.ranking === 1 ? "inline" : ""}
                      ${app.ranking === 2 ? "hidden" : ""}
                      ${app.ranking === 3 ? "hidden" : ""}
                    `}
                    />

                    <img
                      src={crownBlackIcon}
                      alt="Badge"
                      className={`w-4 mr-0.5
                      ${app.ranking === 1 ? "hidden" : ""}
                      ${app.ranking === 2 ? "inline" : ""}
                      ${app.ranking === 3 ? "inline" : ""}
                    `}
                    />

                    {app.ranking === 1 && "1st"}
                    {app.ranking === 2 && "2nd"}
                    {app.ranking === 3 && "3rd"}
                  </span>
                )}
              </div>

              <p className="text-lg text-gray-600 mb-4">
                {app.short_description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {app.categories.map((category) => (
                  <CategoryPricingBadge key={category} variant="category">
                    {category}
                  </CategoryPricingBadge>
                ))}
                <CategoryPricingBadge variant="pricing">
                  {app.pricing}
                </CategoryPricingBadge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      Launched{" "}
                      {new Date(app.launch_week_start).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {!app.is_active && app.ranking && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Trophy className="h-4 w-4" />
                      <span>{app.vote_count} votes</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rel =
                        app.is_winner || app.is_paid ? "dofollow" : "nofollow";
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

                  {app.is_active ? (
                    <button
                      type="button"
                      onClick={handleVote}
                      disabled={votingLoading}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-20 text-md font-semibold transition duration-300 ease-in-out -translate-y-0.5
                      ${
                        hasVoted
                          ? "bg-gray-900 text-white translate-0"
                          : "bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-gray-900 hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0"
                      }
                      ${
                        votingLoading
                          ? "opacity-50 cursor-default"
                          : "cursor-pointer"
                      }`}
                    >
                      <ThumbsUp
                        className={`h-4.5 w-4.5 ${
                          votingLoading ? "animate-pulse" : ""
                        }`}
                      />
                      <span>{app.vote_count}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots & Video */}
        {(app.screenshots?.length > 0 || app.video_url) && (
          <div>
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {app.video_url && (
                    <CarouselItem className="basis-1/1 md:basis-1/2 lg:basis-1/3">
                      <div
                        className="aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group relative"
                        onClick={() => openModal(0, getMediaItems(app))}
                      >
                        <iframe
                          src={app.video_url}
                          className="w-full h-full"
                          allowFullScreen
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title="Product Video"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 rounded-full p-2">
                            <ExternalLink className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  )}

                  {app.screenshots?.map((screenshot, index) => {
                    const mediaIndex = app.video_url ? index + 1 : index;
                    return (
                      <CarouselItem
                        key={index}
                        className="basis-1/1 md:basis-1/2 lg:basis-1/3"
                      >
                        <div
                          className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group relative"
                          onClick={() =>
                            openModal(mediaIndex, getMediaItems(app))
                          }
                        >
                          <img
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 rounded-full p-2">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>

                {getMediaItems(app).length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>

              {/* Modal for enlarged media */}
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
                  <div className="relative">
                    <button
                      onClick={closeModal}
                      className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    {modalMediaItems.length > 1 && modalIndex > 0 && (
                      <button
                        onClick={() => navigateModal("prev")}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}

                    {modalMediaItems.length > 1 &&
                      modalIndex < modalMediaItems.length - 1 && (
                        <button
                          onClick={() => navigateModal("next")}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      )}

                    <div className="aspect-video bg-black">
                      {modalMediaItems[modalIndex]?.type === "video" ? (
                        <iframe
                          src={modalMediaItems[modalIndex]?.src}
                          className="w-full h-full"
                          allowFullScreen
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          title="Product Video"
                        />
                      ) : (
                        <img
                          src={modalMediaItems[modalIndex]?.src}
                          alt={modalMediaItems[modalIndex]?.alt}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {modalMediaItems.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {modalMediaItems.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setModalIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              index === modalIndex
                                ? "bg-white"
                                : "bg-white bg-opacity-50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="font-medium text-xl pb-2 mb-4 border-b-1">About </h3>
          <div className="prose max-w-none">
            {app.full_description.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Related launches */}
        {relatedApps.length > 0 && (
          <div>
            <h3 className="font-medium text-xl pb-2 mb-4 border-b-1">
              Related Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(showAllRelated ? relatedApps : relatedApps.slice(0, 6)).map(
                (relatedApp) => (
                  <Link
                    key={relatedApp.id}
                    to={`/app/${relatedApp.id}`}
                    className="block p-4 border rounded-lg transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={relatedApp.logo_url}
                        alt={relatedApp.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {relatedApp.name}
                          </h3>
                          {relatedApp.ranking && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-normal
                              ${
                                relatedApp.ranking === 1
                                  ? "bg-gray-900 text-white"
                                  : ""
                              }
                              ${
                                relatedApp.ranking === 2
                                  ? "bg-gray-300 text-gray-900"
                                  : ""
                              }
                              ${
                                relatedApp.ranking === 3
                                  ? "bg-gray-200 text-gray-900"
                                  : ""
                              }
                            `}
                            >
                              <img
                                src={crownIcon}
                                alt="Badge"
                                className={`w-4 mr-0.5
                                ${relatedApp.ranking === 1 ? "inline" : ""}
                                ${relatedApp.ranking === 2 ? "hidden" : ""}
                                ${relatedApp.ranking === 3 ? "hidden" : ""}
                              `}
                              />

                              <img
                                src={crownBlackIcon}
                                alt="Badge"
                                className={`w-4 mr-0.5
                                ${relatedApp.ranking === 1 ? "hidden" : ""}
                                ${relatedApp.ranking === 2 ? "inline" : ""}
                                ${relatedApp.ranking === 3 ? "inline" : ""}
                              `}
                              />

                              {relatedApp.ranking === 1 && "1st"}
                              {relatedApp.ranking === 2 && "2nd"}
                              {relatedApp.ranking === 3 && "3rd"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {relatedApp.short_description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {relatedApp.categories
                              .slice(0, 2)
                              .map((category) => (
                                <CategoryPricingBadge
                                  key={category}
                                  variant="category"
                                  className="text-xs"
                                >
                                  {category}
                                </CategoryPricingBadge>
                              ))}
                            <CategoryPricingBadge
                              variant="pricing"
                              className="text-xs"
                            >
                              {relatedApp.pricing}
                            </CategoryPricingBadge>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{relatedApp.vote_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>

            {relatedApps.length > 6 && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllRelated(!showAllRelated)}
                  className="px-6"
                >
                  {showAllRelated
                    ? "Show Less"
                    : `Show More (${relatedApps.length - 6} more)`}
                </Button>
              </div>
            )}
          </div>
        )}
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
