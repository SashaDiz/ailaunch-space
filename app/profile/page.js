"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Settings,
  NavArrowLeft,
  EditPencil,
  Check,
  Xmark,
  Globe,
  Twitter,
  OpenNewWindow,
} from "iconoir-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUserStats } from "../hooks/useUserStats";
import WinnerBadge from "../components/WinnerBadge";

export default function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const userStats = useUserStats();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    twitter: "",
    website: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Load profile data from database
  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/user?type=profile');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const profileData = result.data;
          setProfile({
            name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "",
            email: user.email || "",
            bio: profileData.bio || "",
            twitter: profileData.twitter || "",
            website: profileData.website || "",
          });
          // Prioritize custom uploaded avatar over OAuth provider avatar
          const avatarUrl = profileData.avatar_url || user.user_metadata?.avatar_url || null;
          setProfileImage(avatarUrl);
        }
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
      // Fallback to basic user data
      setProfile({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        email: user.email || "",
        bio: "",
        twitter: "",
        website: "",
      });
      // Use OAuth provider avatar as fallback
      const fallbackAvatarUrl = user.user_metadata?.avatar_url || null;
      setProfileImage(fallbackAvatarUrl);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load user's projects
  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch('/api/user?type=projects&limit=50'); // Show all projects
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects(result.data.projects || []);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/profile");
      return;
    }

    if (user) {
      loadProfileData();
      loadProjects();
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profile.name,
          bio: profile.bio,
          twitter: profile.twitter,
          website: profile.website,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Reload profile data to ensure UI is in sync
        await loadProfileData();
        // Don't update avatar state when updating other profile data
        // Avatar updates are handled separately in handleImageUpload and handleRemoveImage
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    // Reset form to original values by reloading from database
    await loadProfileData();
    setIsEditing(false);
  };

  const handleRemoveImage = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profile.name,
          bio: profile.bio,
          twitter: profile.twitter,
          website: profile.website,
          avatar_url: null, // Remove custom avatar
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProfileImage(null);
        toast.success('Profile image removed successfully!');
        // Reload profile data to ensure UI is in sync
        await loadProfileData();
        // Notify header component to refresh avatar
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      } else {
        throw new Error(result.error || 'Failed to remove profile image');
      }
    } catch (error) {
      console.error('Failed to remove profile image:', error);
      toast.error(error.message || 'Failed to remove profile image');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-supabase', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update user profile with new image URL
        const updateResponse = await fetch('/api/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: profile.name,
            bio: profile.bio,
            twitter: profile.twitter,
            website: profile.website,
            avatar_url: result.data.url,
          }),
        });

        const updateResult = await updateResponse.json();

        if (updateResponse.ok && updateResult.success) {
          setProfileImage(result.data.url);
          toast.success('Profile image updated successfully!');
          // Reload profile data to ensure UI is in sync
          await loadProfileData();
          // Notify header component to refresh avatar
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        } else {
          throw new Error(updateResult.error || 'Failed to update profile');
        }
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-[#ED0D79] hover:bg-gray-50 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm"
              >
                <NavArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ED0D79] text-white font-semibold rounded-lg hover:bg-[#ED0D79]/90 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm"
                >
                  <EditPencil className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm"
                  >
                    <Xmark className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ED0D79] text-white font-semibold rounded-lg hover:bg-[#ED0D79]/90 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
            <p className="text-gray-600">
              Manage your account settings and profile information.
            </p>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="avatar mb-4 relative group">
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden">
                    {profileImage || user.user_metadata?.avatar_url ? (
                      <Image
                        src={profileImage || user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email || "User"}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          // Hide the image and show initials instead
                          const parent = e.target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xl font-bold">
                                ${(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="bg-[#ED0D79] text-white w-full h-full flex items-center justify-center text-xl font-bold">
                        {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex flex-col items-center gap-1">
                      <label htmlFor="profile-image-upload" className="cursor-pointer">
                        {isUploadingImage ? (
                          <span className="loading loading-spinner loading-sm text-white"></span>
                        ) : (
                          <EditPencil className="w-4 h-4 text-white" />
                        )}
                      </label>
                      {profileImage && !isUploadingImage && (
                        <button
                          onClick={handleRemoveImage}
                          className="btn btn-xs btn-error text-white"
                          title="Remove custom image"
                        >
                          <Xmark className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <input
                      id="profile-image-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous User"}
                </h2>

                <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Joined{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="w-full border-t border-gray-200 mb-4"></div>

                <div className="grid grid-cols-2 gap-4 text-center w-full">
                  <div>
                    <div className="text-xl font-bold text-[#ED0D79] mb-1">
                      {userStats.loading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        userStats.totalSubmissions || 0
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Submissions
                    </div>
                    {userStats.error && (
                      <div className="text-xs text-red-500 mt-1">
                        Error loading data
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#ED0D79] mb-1">
                      {userStats.loading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        userStats.totalVotes || 0
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Votes Cast
                    </div>
                    {userStats.error && (
                      <div className="text-xs text-red-500 mt-1">
                        Error loading data
                      </div>
                    )}
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

              {isEditing ? (
                <div className="space-y-6">
                  {/* Display Name */}
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        id="display-name"
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED0D79] focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600 font-medium">B</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED0D79] focus:border-transparent"
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Twitter */}
                  <div className="flex items-center space-x-3">
                    <Twitter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter
                      </label>
                      <input
                        id="twitter"
                        type="text"
                        value={profile.twitter}
                        onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED0D79] focus:border-transparent"
                        placeholder="@username"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        id="website"
                        type="url"
                        value={profile.website}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED0D79] focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Name */}
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-700">Display Name</h4>
                      <p className="text-gray-900 font-medium">{profile.name || "Not set"}</p>
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
              )}
            </div>
          </div>
        </div>

        {/* User's Projects Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            My Projects
          </h3>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No projects submitted yet</p>
              <Link 
                href="/submit" 
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#ED0D79] text-white text-sm font-medium rounded-lg hover:bg-[#ED0D79]/90 transition-colors"
              >
                <EditPencil className="w-4 h-4" />
                Submit Project
              </Link>
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
                  <div
                    key={project.id}
                    className="relative block p-4 rounded-lg border border-gray-200 hover:border-[#ED0D79] hover:bg-gray-50 transition-all duration-200 group"
                  >
                    {/* Project Link - Main Clickable Area */}
                    <Link
                      href={`/project/${project.slug}`}
                      className="block"
                    >
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

                    {/* External Link - Top Right Corner */}
                    <a
                      href={websiteLink.url}
                      target="_blank"
                      rel={websiteLink.rel}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-[#ED0D79] transition-colors z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OpenNewWindow className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
