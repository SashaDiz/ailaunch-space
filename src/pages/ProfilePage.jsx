import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditProfileDialog } from "@/components/ui/EditProfileDialog";
import { CategoryPricingBadge } from "@/components/ui/CategoryPricingBadge";
import {
  Globe,
  Twitter,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Edit,
  Star,
  Users,
  TrendingUp,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import crownIcon from "@/assets/crown.svg";
import crownBlackIcon from "@/assets/crown-black.svg";
import { useUser } from "@clerk/clerk-react";

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const handleProfileUpdate = (updatedProfile) => {
    setProfileData(updatedProfile);
  };

  useEffect(() => {
    if (!isLoaded) {
      setProfileLoading(true);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setProfileLoading(true);

        // Check if viewing own profile or another user's profile
        const viewingOwnProfile = !userId || userId === user?.id;
        setIsOwnProfile(viewingOwnProfile);

        let profileResponse;

        if (viewingOwnProfile && user) {
          // Fetch own profile data from database
          console.log("Fetching profile for user:", user.id);

          // Simple approach - pass user ID as query parameter instead of using auth headers
          profileResponse = await fetch(`/api/profile?userId=${user.id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          console.log("Profile response status:", profileResponse.status);
        } else if (userId && userId !== user?.id) {
          // Fetch other user's profile
          console.log("Fetching profile for other user:", userId);
          profileResponse = await fetch(`/api/profile/${userId}`);
        } else {
          // No user signed in and no specific userId
          console.log("No user or userId available");
          setProfileData(null);
          setUserProjects([]);
          setProfileLoading(false);
          return;
        }

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setProfileData(profile);
        } else if (profileResponse.status === 404) {
          console.log("Profile not found");
          setProfileData(null);
        } else {
          console.error(
            "Failed to fetch profile:",
            await profileResponse.text()
          );
          setProfileData(null);
        }

        // Mock projects data - replace with actual API call later
        const mockProjects = [
          {
            id: "1",
            name: "TaskFlow Pro",
            description: "A modern project management tool for small teams",
            category: "Productivity",
            categories: ["Productivity", "Developer Tools"],
            pricing: "Freemium",
            launchDate: "2024-06-15",
            status: "past", // live, upcoming, past, current
            views: 5240,
            upvotes: 89,
            vote_count: 89,
            position: 1,
            is_winner: true,
            website: "https://taskflowpro.com",
            website_url: "https://taskflowpro.com",
            image:
              "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop",
            logo_url:
              "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop",
            short_description:
              "A modern project management tool for small teams",
          },
          {
            id: "2",
            name: "CodeSnippet Manager",
            description: "Organize and share your code snippets with your team",
            category: "Developer Tools",
            categories: ["Developer Tools", "APIs & Integrations"],
            pricing: "Paid",
            launchDate: "2025-08-04", // Current launch (today-ish)
            status: "current",
            views: 3280,
            upvotes: 67,
            vote_count: 67,
            position: null,
            is_winner: false,
            website: "https://codesnippets.dev",
            website_url: "https://codesnippets.dev",
            image:
              "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=300&h=200&fit=crop",
            logo_url:
              "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=60&h=60&fit=crop",
            short_description:
              "Organize and share your code snippets with your team",
          },
          {
            id: "3",
            name: "Design System Builder",
            description:
              "Create consistent design systems for your web projects",
            category: "Design",
            categories: ["Design", "UI/UX"],
            pricing: "Free",
            launchDate: "2024-04-10",
            status: "past",
            views: 6900,
            upvotes: 124,
            vote_count: 124,
            position: 3,
            is_winner: true,
            website: "https://designsystem.build",
            website_url: "https://designsystem.build",
            image:
              "https://images.unsplash.com/photo-1558655146-d09347e92766?w=300&h=200&fit=crop",
            logo_url:
              "https://images.unsplash.com/photo-1558655146-d09347e92766?w=60&h=60&fit=crop",
            short_description:
              "Create consistent design systems for your web projects",
          },
          {
            id: "4",
            name: "AI Content Generator",
            description:
              "Generate high-quality content using advanced AI models",
            category: "AI & LLM",
            categories: ["AI & LLM", "Content"],
            pricing: "Freemium",
            launchDate: "2025-08-15", // Upcoming launch
            status: "upcoming",
            views: 0,
            upvotes: 0,
            vote_count: 0,
            position: null,
            is_winner: false,
            website: "https://aicontentgen.com",
            website_url: "https://aicontentgen.com",
            image:
              "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop",
            logo_url:
              "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=60&h=60&fit=crop",
            short_description:
              "Generate high-quality content using advanced AI models",
          },
        ];

        setUserProjects(mockProjects);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileData(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user, isLoaded]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "?"
    );
  };

  const getProjectStatusInfo = (project) => {
    const launchDate = new Date(project.launchDate);
    const today = new Date();
    const timeDiff = launchDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    switch (project.status) {
      case "upcoming":
        if (daysDiff > 0) {
          return {
            label: `Launches in ${daysDiff} day${daysDiff === 1 ? "" : "s"}`,
            badgeText: "Upcoming",
            badgeVariant: "outline",
          };
        } else {
          return {
            label: `Launches ${formatDate(project.launchDate)}`,
            badgeText: "Upcoming",
            badgeVariant: "outline",
          };
        }
      case "current":
        return {
          label: "Launching now",
          badgeText: "Live",
          badgeVariant: "default",
        };
      case "past":
        return {
          label: `Launched ${formatDate(project.launchDate)}`,
          badgeText:
            project.position <= 3
              ? `${project.position}${
                  project.position === 1
                    ? "st"
                    : project.position === 2
                    ? "nd"
                    : "rd"
                } Place`
              : "Past",
          badgeVariant: "secondary",
        };
      default:
        return {
          label: `Launched ${formatDate(project.launchDate)}`,
          badgeText: "Live",
          badgeVariant: "default",
        };
    }
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show not found if no profile data
  if (!profileData) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The profile you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <div className="border border-gray-200 rounded-lg p-6 space-y-6">
            <div className="text-center mb-6">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profileData.image} alt={profileData.name} />
                <AvatarFallback className="text-xl font-bold">
                  {getInitials(profileData.name)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profileData.name}
              </h2>

              {profileData.location && (
                <div className="flex items-center justify-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profileData.location}
                </div>
              )}

              <div className="flex items-center justify-center text-gray-600 mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {formatDate(profileData.joinedAt)}
              </div>

              {isOwnProfile && (
                <EditProfileDialog
                  onProfileUpdate={handleProfileUpdate}
                  profileData={profileData}
                >
                  <Button
                    variant="outline"
                    className="flex items-center justify-center w-full mb-4 border-1 border-gray-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </EditProfileDialog>
              )}
            </div>

            {profileData.bio && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {profileData.bio}
                </p>
              </div>
            )}

            {/* Social Links */}
            <div className="space-y-3">
              {profileData.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-4 h-4 mr-3" />
                  <span className="text-sm truncate">
                    {profileData.website}
                  </span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}

              {profileData.twitter && (
                <a
                  href={`https://twitter.com/${profileData.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Twitter className="w-4 h-4 mr-3" />
                  <span className="text-sm">@{profileData.twitter}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}

              {profileData.github && (
                <a
                  href={`https://github.com/${profileData.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Github className="w-4 h-4 mr-3" />
                  <span className="text-sm">@{profileData.github}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}

              {profileData.linkedin && (
                <a
                  href={`https://linkedin.com/in/${profileData.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Linkedin className="w-4 h-4 mr-3" />
                  <span className="text-sm">{profileData.linkedin}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}

              {profileData.email && isOwnProfile && (
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-3" />
                  <span className="text-sm truncate">{profileData.email}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            {profileData.stats && (
              <>
                <Separator className="my-6" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {profileData.stats.projectsLaunched}
                    </div>
                    <div className="text-xs text-gray-600">Projects</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {profileData.stats.totalViews?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Views</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {profileData.stats.followers}
                    </div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg p-6 space-y-6">
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Launched Projects ({userProjects.length})
            </CardTitle>
            {userProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 mb-4">
                  {isOwnProfile
                    ? "You haven't launched any projects yet. Start building something amazing!"
                    : "This user hasn't launched any projects yet."}
                </p>
                {isOwnProfile && (
                  <Button onClick={() => navigate("/submit")}>
                    Submit Your First Project
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userProjects.map((project) => {
                  const statusInfo = getProjectStatusInfo(project);
                  return (
                    <div
                      key={project.id}
                      className={`w-full bg-white rounded-xl border flex flex-row items-center p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5 
                        ${project.position === 1 ? "border-gray-900" : ""}
                        ${project.position === 2 ? "border-gray-600" : ""}
                        ${project.position === 3 ? "border-gray-400" : ""}`}
                      onClick={() =>
                        project.status !== "upcoming" &&
                        navigate(`/app/${project.id}`)
                      }
                    >
                      {/* Left: Logo, Name, Description */}
                      <div className="flex items-center flex-1 min-w-0 gap-4">
                        <img
                          src={project.logo_url || project.image}
                          alt={project.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate text-lg">
                              {project.name}
                            </h3>
                            <Badge
                              variant={statusInfo.badgeVariant}
                              className="text-xs"
                            >
                              {statusInfo.badgeText}
                            </Badge>
                            {project.position && project.position <= 3 && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-normal
                              ${
                                project.position === 1
                                  ? "bg-gray-900 text-white"
                                  : ""
                              }
                              ${
                                project.position === 2
                                  ? "bg-gray-300 text-gray-900"
                                  : ""
                              }
                              ${
                                project.position === 3
                                  ? "bg-gray-200 text-gray-900"
                                  : ""
                              }
                            `}
                              >
                                <img
                                  src={crownIcon}
                                  alt="Badge"
                                  className={`w-4 mr-0.5
                                ${project.position === 1 ? "inline" : ""}
                                ${project.position === 2 ? "hidden" : ""}
                                ${project.position === 3 ? "hidden" : ""}
                              `}
                                />

                                <img
                                  src={crownBlackIcon}
                                  alt="Badge"
                                  className={`w-4 mr-0.5
                                ${project.position === 1 ? "hidden" : ""}
                                ${project.position === 2 ? "inline" : ""}
                                ${project.position === 3 ? "inline" : ""}
                              `}
                                />

                                {project.position === 1 && "1st"}
                                {project.position === 2 && "2nd"}
                                {project.position === 3 && "3rd"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 line-clamp-2 mt-1">
                            {project.short_description || project.description}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            {statusInfo.label}
                          </div>
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(project.categories || [project.category])
                              .filter(Boolean)
                              .map((category) => (
                                <CategoryPricingBadge
                                  key={category}
                                  variant="category"
                                  className="px-2 py-0.5 rounded-sm text-xs font-medium"
                                >
                                  {category}
                                </CategoryPricingBadge>
                              ))}
                            {project.pricing && (
                              <CategoryPricingBadge
                                variant="pricing"
                                className="px-2 py-0.5 rounded-sm text-xs font-medium"
                              >
                                {project.pricing}
                              </CategoryPricingBadge>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Right: Buttons */}
                      <div className="flex flex-row items-center gap-4 ml-4">
                        {project.website_url &&
                          project.status !== "upcoming" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const rel = project.is_winner
                                  ? "dofollow"
                                  : "nofollow";
                                window.open(
                                  project.website_url,
                                  "_blank",
                                  rel === "dofollow" ? "" : "nofollow"
                                );
                              }}
                              className="cursor-pointer inline-flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-gray-600 hover:bg-gray-100 transition"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}

                        {/* Show edit/delete buttons for upcoming launches if it's the user's own profile */}
                        {project.status === "upcoming" && isOwnProfile ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Navigate to edit page or open edit dialog
                                navigate(`/submit/${project.id}`);
                              }}
                              className="cursor-pointer inline-flex items-center bg-gray-100 border border-gray-300 px-3.5 py-3.5 rounded-lg text-sm font-semibold transition duration-300 ease-in-out hover:bg-gray-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Handle delete functionality
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this project?"
                                  )
                                ) {
                                  console.log("Delete project:", project.id);
                                }
                              }}
                              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-3.5 rounded-lg text-sm font-semibold transition duration-300 ease-in-out bg-red-100 border border-red-300 text-red-600 hover:bg-red-200 hover:border-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : project.status === "current" ? (
                          /* Show voting button for current launches */
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle voting functionality
                              console.log("Vote for project:", project.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-20 text-md font-semibold transition duration-300 ease-in-out bg-white text-black shadow-[0_4px_0_rgba(0,0,0,1)] border-2 border-gray-900 hover:shadow-[0_2px_0_rgba(0,0,0,1)] hover:translate-y-0.5`}
                          >
                            <ThumbsUp className="h-4.5 w-4.5" />
                            <span>
                              {project.vote_count || project.upvotes || 0}
                            </span>
                          </button>
                        ) : (
                          /* Show vote count for past projects */
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-20 text-md font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            <ThumbsUp className="h-4.5 w-4.5" />
                            <span>
                              {project.vote_count || project.upvotes || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
