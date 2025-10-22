"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  User,
  Calendar,
  Globe,
  Twitter,
  OpenNewWindow,
  NavArrowLeft,
} from "iconoir-react";
import Link from "next/link";
import WinnerBadge from "../../components/WinnerBadge";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id;
  const { user: currentUser, loading: authLoading } = useUser();
  const router = useRouter();
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
    totalVotes: 0,
  });
  const [isOwner, setIsOwner] = useState(false);

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
            totalVotes: profileData.totalVotes || 0,
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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Link 
                href="/projects" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-[#ED0D79] hover:bg-gray-50 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm"
              >
                <NavArrowLeft className="w-4 h-4" />
                Back to Projects
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.name}'s Profile
            </h1>
            <p className="text-gray-600">
              View profile information and projects.
            </p>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="avatar mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          const parent = e.target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xl font-bold">
                                ${profile.name[0]?.toUpperCase() || "U"}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xl font-bold">
                        {profile.name[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {profile.name}
                </h2>

                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-4">
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

                <div className="w-full border-t border-gray-200 mb-4"></div>

                <div className="grid grid-cols-2 gap-4 text-center w-full">
                  <div>
                    <div className="text-xl font-bold text-[#ED0D79] mb-1">
                      {userStats.totalSubmissions}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Submissions
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#ED0D79] mb-1">
                      {userStats.totalVotes}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Votes Cast
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Information
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700">Display Name</h4>
                    <p className="text-gray-900 font-medium">{profile.name}</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">B</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                      <p className="text-gray-900 text-sm">{profile.bio}</p>
                    </div>
                  </div>
                )}

                {/* Twitter */}
                {profile.twitter && (
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-700">Twitter</h4>
                      <a
                        href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[#ED0D79] hover:text-[#ED0D79]/80 transition-colors font-medium text-sm"
                      >
                        @{profile.twitter.replace('@', '')}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {profile.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-700">Website</h4>
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[#ED0D79] hover:text-[#ED0D79]/80 transition-colors font-medium text-sm break-all"
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Projects
          </h3>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No projects submitted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                // Generate website link with ref parameter and proper rel attribute
                const getWebsiteLink = () => {
                  if (!project?.website_url) return { url: '#', rel: 'nofollow noopener noreferrer' };
                  
                  try {
                    const url = new URL(project.website_url);
                    url.searchParams.set('ref', 'ailaunchspace');
                    
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
                    className="relative block p-4 rounded-lg border border-gray-200 hover:border-[#ED0D79] hover:bg-gray-50 transition-all duration-200 group"
                  >
                    {/* External Link - Top Right Corner */}
                    <a
                      href={websiteLink.url}
                      target="_blank"
                      rel={websiteLink.rel}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-[#ED0D79] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OpenNewWindow className="w-4 h-4" />
                    </a>

                    <div className="flex items-start space-x-3">
                      {/* Project Logo */}
                      <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                        <Image
                          src={project.logo_url}
                          alt={`${project.name} logo`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {project.name}
                          </h4>
                          {/* Winner Badge */}
                          <WinnerBadge position={project.weekly_position} size="xs" />
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
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
