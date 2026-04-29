"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@/hooks/use-user';
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  User,
  Calendar,
  Globe,
  Twitter,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { getLogoDevUrl } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id;
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    twitter: "",
    website: "",
    avatar_url: "",
    created_at: "",
  });
  const [projects, setProjects] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [userStats, setUserStats] = useState({
    totalSubmissions: 0,
  });
  const [isOwner, setIsOwner] = useState(false);

  const avatarSrc = profile.avatar_url || "";
  const avatarInitial = profile.name?.[0]?.toUpperCase() || "U";
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc, profile.name]);

  // Load public profile data
  const loadPublicProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(`/api/user/public/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const profileData = result.data;
          setProfile({
            name: profileData.full_name || "Anonymous User",
            bio: profileData.bio || "",
            twitter: profileData.twitter || "",
            website: profileData.website || "",
            avatar_url: profileData.avatar_url || "",
            created_at: profileData.created_at || "",
          });
          setUserStats({
            totalSubmissions: profileData.totalSubmissions || 0,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load public profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load user's public projects
  const loadPublicProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch(`/api/user/public/${userId}/projects`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects(result.data.projects || []);
        }
      }
    } catch (error) {
      console.error("Failed to load public projects:", error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
      loadPublicProjects();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser && userId) {
      setIsOwner(currentUser.id === userId);
    }
  }, [currentUser, userId]);


  return (
    <div className="min-h-screen bg-transparent">
      <div className="container-classic py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/#projects-section">Browse</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px]">
                {profile.name}&apos;s Profile
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {profile.name}&apos;s Profile
          </h1>
          <p className="text-muted-foreground">
            View profile information and projects.
          </p>
        </div>

        {/* Profile Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="rounded-[var(--radius)] border border-border bg-card p-6" style={{ boxShadow: "var(--card-shadow)" }}>
              <div className="flex flex-col items-center text-center">
                <div className="avatar mb-4">
                  <div className="w-24 h-24 rounded-full border border-border overflow-hidden">
                    {avatarSrc && !avatarError ? (
                      <Image
                        src={avatarSrc}
                        alt={profile.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                        unoptimized={true}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="bg-foreground text-background w-full h-full flex items-center justify-center text-xl font-bold">
                        {avatarInitial}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-foreground mb-1">
                  {profile.name}
                </h2>

                <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Joined{" "}
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Unknown"}
                  </span>
                </div>

                <div className="w-full border-t border-border mb-4"></div>

                <div className="grid grid-cols-1 gap-4 text-center w-full">
                  <div>
                    <div className="text-xl font-bold text-foreground mb-1">
                      {userStats.totalSubmissions}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Submissions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Display */}
          <div className="lg:col-span-2">
            <div className="rounded-[var(--radius)] border border-border bg-card p-6" style={{ boxShadow: "var(--card-shadow)" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Profile Information
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Display Name</h4>
                    <p className="text-foreground font-medium">{profile.name}</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">B</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
                      <p className="text-foreground text-sm">{profile.bio}</p>
                    </div>
                  </div>
                )}

                {/* Twitter */}
                {profile.twitter && (
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Twitter</h4>
                      <a
                        href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-foreground hover:text-foreground/80 transition-colors font-medium text-sm"
                      >
                        @{profile.twitter.replace('@', '')}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {profile.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-foreground hover:text-foreground/80 transition-colors font-medium text-sm break-all"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Projects Section */}
        <div className="rounded-[var(--radius)] border border-border bg-card p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Projects
          </h3>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No projects submitted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                // Generate website link with ref parameter and proper rel attribute
                const getWebsiteLink = () => {
                  if (!project?.website_url) return { url: '#', rel: 'nofollow noopener noreferrer' };
                  
                  try {
                    const url = new URL(project.website_url);
                    url.searchParams.set('ref', siteConfig.refParameter);
                    
                    // Use link_type field from database
                    const isDofollow = project.link_type === "dofollow";
                    
                    return {
                      url: url.toString(),
                      rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
                    };
                  } catch (error) {
                    return { url: project.website_url, rel: 'nofollow noopener noreferrer' };
                  }
                };

                const websiteLink = getWebsiteLink();

                return (
                  <Link
                    key={project.id}
                    href={`/project/${project.slug}`}
                    className="relative block p-4 rounded-[var(--radius)] border border-border hover:border-foreground hover:bg-muted transition-all duration-200 group"
                  >
                    {/* External Link - Top Right Corner */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(websiteLink.url, '_blank', 'noopener,noreferrer');
                      }}
                      className="absolute top-3 right-3 p-1 text-muted-foreground/60 hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring bg-transparent border-0 cursor-pointer"
                      aria-label={`Open ${project.name} in new tab`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <div className="flex items-start space-x-3">
                      {/* Project Logo */}
                      <div className="w-12 h-12 rounded-[var(--radius)] border border-border overflow-hidden flex-shrink-0">
                        {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
                          <Image
                            src={project.logo_url || getLogoDevUrl(project.website_url)}
                            alt={`${project.name} logo`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-foreground bg-muted">
                            {project.name?.[0] ?? "?"}
                          </div>
                        )}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {project.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.short_description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
