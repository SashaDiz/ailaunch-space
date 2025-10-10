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
} from "iconoir-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUserStats } from "../hooks/useUserStats";

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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/profile");
      return;
    }

    if (user) {
      setProfile({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        email: user.email || "",
        bio: "",
        twitter: "",
        website: "",
      });
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would typically make an API call to update the user profile
      // For now, we'll just simulate a successful update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setProfile({
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
      email: user.email || "",
      bio: "",
      twitter: "",
      website: "",
    });
    setIsEditing(false);
  };

  if (authLoading) {
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
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                <NavArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary btn-sm"
                  >
                    {isSaving ? (
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                    ) : null}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-base-content/70 mt-2">
              Manage your account settings and profile information.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-sm border border-base-300 sticky top-8">
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="avatar mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-base-300">
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email || "User"}
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-2xl font-bold">
                        {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-1">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous User"}
                </h2>
                <p className="text-base-content/60 text-sm mb-4">
                  {user.email}
                </p>

                <div className="flex items-center justify-center space-x-1 text-sm text-base-content/60">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="divider"></div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {userStats.loading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        userStats.totalSubmissions || 0
                      )}
                    </div>
                    <div className="text-xs text-base-content/60">
                      Submissions
                    </div>
                    {userStats.error && (
                      <div className="text-xs text-error mt-1">
                        Error loading data
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">
                      {userStats.loading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        userStats.totalVotes || 0
                      )}
                    </div>
                    <div className="text-xs text-base-content/60">
                      Votes Cast
                    </div>
                    {userStats.error && (
                      <div className="text-xs text-error mt-1">
                        Error loading data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-6">
                <h3 className="text-lg font-semibold mb-6">
                  Profile Information
                </h3>

                <div className="space-y-6">
                  {/* Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Display Name
                      </span>
                      <span className="label-text-alt">Required</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="input input-bordered w-full pl-10"
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Email Address
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        Read-only
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled={true}
                        className="input input-bordered w-full pl-10 bg-base-200/50"
                      />
                    </div>
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        Email address is managed by your OAuth provider
                      </span>
                    </label>
                  </div>

                  {/* Bio */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Bio</span>
                      <span className="label-text-alt">Optional</span>
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      disabled={!isEditing}
                      className="textarea textarea-bordered h-24 resize-none"
                      placeholder="Tell us a bit about yourself..."
                      maxLength={160}
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">
                        {profile.bio.length}/160 characters
                      </span>
                    </label>
                  </div>

                  {/* Twitter */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Twitter Username
                      </span>
                      <span className="label-text-alt">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={profile.twitter}
                        onChange={(e) =>
                          setProfile({ ...profile, twitter: e.target.value })
                        }
                        disabled={!isEditing}
                        className="input input-bordered w-full pl-8"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Website</span>
                      <span className="label-text-alt">Optional</span>
                    </label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) =>
                        setProfile({ ...profile, website: e.target.value })
                      }
                      disabled={!isEditing}
                      className="input input-bordered w-full"
                      placeholder="https://your-website.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
