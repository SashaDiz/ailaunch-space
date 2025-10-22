"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/navigation";
import { useSupabase } from "../components/SupabaseProvider";
import {
  NavArrowLeft,
  Trash,
  Link as LinkIcon,
  WarningTriangle,
  Github,
  Bell,
  Check,
} from "iconoir-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [connectedProviders, setConnectedProviders] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLinking, setIsLinking] = useState({});
  
  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    account_creation: true,
    account_deletion: true,
    weekly_competition_entry: true,
    submission_approval: true,
    submission_decline: true,
    competition_winners: true,
    winner_reminder: true,
    weekly_digest: false,
    marketing_emails: false
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/settings");
      return;
    }

    // Get connected providers from user metadata
    fetchConnectedProviders();
    
    // Get notification preferences
    fetchNotificationPreferences();
  }, [user, authLoading, router]);

  const fetchConnectedProviders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.auth.getUserIdentities();
      
      if (error) {
        console.error("Error fetching identities:", error);
        return;
      }

      if (data && data.identities) {
        const providers = data.identities.map((identity) => ({
          provider: identity.provider,
          id: identity.id,
          email: identity.identity_data?.email,
          created_at: identity.created_at,
        }));
        setConnectedProviders(providers);
      }
    } catch (error) {
      console.error("Failed to fetch connected providers:", error);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching notification preferences:", error);
        return;
      }

      if (data?.notification_preferences) {
        setNotificationPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    }
  };

  const updateNotificationPreferences = async () => {
    if (!user) return;

    setIsUpdatingNotifications(true);
    try {
      // Ensure mandatory notifications are always enabled
      const mandatoryNotifications = [
        'account_creation',
        'account_deletion',
        'submission_approval',
        'submission_decline'
      ];

      const updatedPreferences = { ...notificationPreferences };
      
      // Force mandatory notifications to be enabled
      mandatoryNotifications.forEach(type => {
        updatedPreferences[type] = true;
      });

      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: updatedPreferences })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state to reflect the enforced preferences
      setNotificationPreferences(updatedPreferences);

      toast.success("Notification preferences updated successfully");
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const toggleNotificationPreference = (key) => {
    // Prevent toggling mandatory notifications
    const mandatoryNotifications = [
      'account_creation',
      'account_deletion',
      'submission_approval',
      'submission_decline'
    ];

    if (mandatoryNotifications.includes(key)) {
      toast.error("This notification cannot be disabled");
      return;
    }

    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLinkProvider = async (provider) => {
    setIsLinking({ ...isLinking, [provider]: true });
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        },
      });

      if (error) {
        if (error.message.includes("already linked")) {
          toast.error("This account is already linked to another user");
        } else {
          toast.error(`Failed to link ${provider}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Link ${provider} error:`, error);
      toast.error(`An error occurred while linking ${provider}`);
    } finally {
      setIsLinking({ ...isLinking, [provider]: false });
    }
  };

  const handleUnlinkProvider = async (identity) => {
    // Check if this is the only identity
    if (connectedProviders.length === 1) {
      toast.error("Cannot unlink your only authentication method");
      return;
    }

    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);

      if (error) {
        toast.error(`Failed to unlink provider: ${error.message}`);
      } else {
        toast.success("Provider unlinked successfully");
        fetchConnectedProviders();
      }
    } catch (error) {
      console.error("Unlink provider error:", error);
      toast.error("An error occurred while unlinking the provider");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      // First, delete user's data
      const { error: deleteError } = await fetch("/api/user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      if (deleteError) {
        throw new Error(deleteError);
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      toast.success("Your account has been deleted");
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "github":
        return <Github className="w-5 h-5" />;
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  const isProviderConnected = (provider) => {
    return connectedProviders.some((p) => p.provider === provider);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#ED0D79] transition-colors duration-200 mb-6"
          >
            <NavArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
              <p className="text-gray-600">
                Manage your connected accounts, notification preferences, and account security.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Preferences Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#ED0D79]/10 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#ED0D79]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Notifications</h2>
                <p className="text-gray-600 text-sm">
                  Manage your email notification preferences. Some notifications are required and cannot be disabled.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Competition Notifications */}
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ED0D79] rounded-full"></div>
                  Competition Updates
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Weekly Competition Entry</h4>
                      <p className="text-sm text-gray-600 mt-1">When your project enters a weekly competition</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.weekly_competition_entry}
                        onChange={() => toggleNotificationPreference('weekly_competition_entry')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.weekly_competition_entry ? 'bg-[#ED0D79]' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.weekly_competition_entry ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Competition Winners</h4>
                      <p className="text-sm text-gray-600 mt-1">When you win a position in competitions</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.competition_winners}
                        onChange={() => toggleNotificationPreference('competition_winners')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.competition_winners ? 'bg-[#ED0D79]' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.competition_winners ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Winner Badge Reminder</h4>
                      <p className="text-sm text-gray-600 mt-1">Reminders to add winner badges for dofollow links</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.winner_reminder}
                        onChange={() => toggleNotificationPreference('winner_reminder')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.winner_reminder ? 'bg-[#ED0D79]' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.winner_reminder ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Optional Notifications */}
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Optional Updates
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                      <p className="text-sm text-gray-600 mt-1">Weekly summary of AI Launch Space activity</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.weekly_digest}
                        onChange={() => toggleNotificationPreference('weekly_digest')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.weekly_digest ? 'bg-[#ED0D79]' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.weekly_digest ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                      <p className="text-sm text-gray-600 mt-1">Product updates and promotional content</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.marketing_emails}
                        onChange={() => toggleNotificationPreference('marketing_emails')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.marketing_emails ? 'bg-[#ED0D79]' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPreferences.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={updateNotificationPreferences}
                  disabled={isUpdatingNotifications}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ED0D79] text-white font-semibold text-sm rounded-lg hover:bg-[#ED0D79]/90 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingNotifications ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#ED0D79]/10 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-[#ED0D79]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connected Accounts</h2>
                <p className="text-gray-600 text-sm">
                  Link multiple accounts to sign in with different providers for enhanced security.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Google */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    {getProviderIcon("google")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Google</h3>
                    {isProviderConnected("google") ? (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-600 font-medium">Connected</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Not connected</p>
                    )}
                  </div>
                </div>
                {isProviderConnected("google") ? (
                  <button
                    onClick={() => {
                      const googleIdentity = connectedProviders.find(
                        (p) => p.provider === "google"
                      );
                      if (googleIdentity) {
                        handleUnlinkProvider(googleIdentity);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={connectedProviders.length === 1}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkProvider("google")}
                    disabled={isLinking.google}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#ED0D79] bg-[#ED0D79]/10 border border-[#ED0D79]/20 rounded-lg hover:bg-[#ED0D79]/20 hover:border-[#ED0D79]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLinking.google ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#ED0D79]/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    {getProviderIcon("github")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">GitHub</h3>
                    {isProviderConnected("github") ? (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-600 font-medium">Connected</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Not connected</p>
                    )}
                  </div>
                </div>
                {isProviderConnected("github") ? (
                  <button
                    onClick={() => {
                      const githubIdentity = connectedProviders.find(
                        (p) => p.provider === "github"
                      );
                      if (githubIdentity) {
                        handleUnlinkProvider(githubIdentity);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={connectedProviders.length === 1}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkProvider("github")}
                    disabled={isLinking.github}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#ED0D79] bg-[#ED0D79]/10 border border-[#ED0D79]/20 rounded-lg hover:bg-[#ED0D79]/20 hover:border-[#ED0D79]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLinking.github ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>
            </div>

            {connectedProviders.length === 1 && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <WarningTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Security Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      You must have at least one connected account to sign in. Link another account before disconnecting this one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Trash className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                <p className="text-gray-600 text-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <WarningTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning: This action is irreversible</p>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting your account will permanently remove all your data, including projects, votes, and profile information.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold text-sm bg-red-600 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm"
            >
              <Trash className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <WarningTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will permanently delete your account and all associated data, including:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  All your submitted projects
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Your votes and interactions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Your profile information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  All associated data
                </li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <WarningTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Final Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    This action cannot be undone. Please be certain before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 px-4 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-white font-semibold text-sm bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="w-5 h-5" />
                    Delete My Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

