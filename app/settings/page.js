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
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4">
            <NavArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-base-content/70 mt-2">
            Manage your connected accounts and account preferences.
          </p>
        </div>

        {/* Notification Preferences Section */}
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <Bell className="w-5 h-5" />
              Email Notifications
            </h2>
            <p className="text-base-content/70 mb-6">
              Manage your email notification preferences. Some notifications are required and cannot be disabled.
            </p>

            <div className="space-y-4">
              {/* Competition Notifications */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Competitions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                    <div>
                      <h4 className="font-medium">Weekly Competition Entry</h4>
                      <p className="text-sm text-base-content/60">When your project enters a weekly competition</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notificationPreferences.weekly_competition_entry}
                      onChange={() => toggleNotificationPreference('weekly_competition_entry')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                    <div>
                      <h4 className="font-medium">Competition Winners</h4>
                      <p className="text-sm text-base-content/60">When you win a position in competitions</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notificationPreferences.competition_winners}
                      onChange={() => toggleNotificationPreference('competition_winners')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                    <div>
                      <h4 className="font-medium">Winner Badge Reminder</h4>
                      <p className="text-sm text-base-content/60">Reminders to add winner badges for dofollow links</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notificationPreferences.winner_reminder}
                      onChange={() => toggleNotificationPreference('winner_reminder')}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notifications */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Optional</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                    <div>
                      <h4 className="font-medium">Weekly Digest</h4>
                      <p className="text-sm text-base-content/60">Weekly summary of Directory Hunt activity</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notificationPreferences.weekly_digest}
                      onChange={() => toggleNotificationPreference('weekly_digest')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                    <div>
                      <h4 className="font-medium">Marketing Emails</h4>
                      <p className="text-sm text-base-content/60">Product updates and promotional content</p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={notificationPreferences.marketing_emails}
                      onChange={() => toggleNotificationPreference('marketing_emails')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={updateNotificationPreferences}
                  disabled={isUpdatingNotifications}
                  className="btn btn-primary"
                >
                  {isUpdatingNotifications ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Connected Accounts</h2>
            <p className="text-base-content/70 mb-6">
              Link multiple accounts to sign in with different providers.
            </p>

            <div className="space-y-4">
              {/* Google */}
              <div className="flex items-center justify-between p-4 border border-base-300 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getProviderIcon("google")}
                  <div>
                    <h3 className="font-medium">Google</h3>
                    {isProviderConnected("google") ? (
                      <p className="text-sm text-success">Connected</p>
                    ) : (
                      <p className="text-sm text-base-content/60">
                        Not connected
                      </p>
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
                    className="btn btn-outline btn-sm btn-error"
                    disabled={connectedProviders.length === 1}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkProvider("google")}
                    disabled={isLinking.google}
                    className="btn btn-outline btn-sm"
                  >
                    {isLinking.google ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-4 border border-base-300 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getProviderIcon("github")}
                  <div>
                    <h3 className="font-medium">GitHub</h3>
                    {isProviderConnected("github") ? (
                      <p className="text-sm text-success">Connected</p>
                    ) : (
                      <p className="text-sm text-base-content/60">
                        Not connected
                      </p>
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
                    className="btn btn-outline btn-sm btn-error"
                    disabled={connectedProviders.length === 1}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkProvider("github")}
                    disabled={isLinking.github}
                    className="btn btn-outline btn-sm"
                  >
                    {isLinking.github ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>
            </div>

            {connectedProviders.length === 1 && (
              <div className="alert alert-info mt-4">
                <WarningTriangle className="w-5 h-5" />
                <span className="text-sm">
                  You must have at least one connected account to sign in. Link
                  another account before disconnecting this one.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card bg-base-100 shadow-sm border border-error">
          <div className="card-body">
            <h2 className="card-title text-xl text-error mb-2">Danger Zone</h2>
            <p className="text-base-content/70 mb-6">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-error btn-outline w-full sm:w-auto"
            >
              <Trash className="w-5 h-5 mr-2" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error mb-4">
              <WarningTriangle className="w-6 h-6 inline mr-2" />
              Delete Account
            </h3>
            <p className="mb-4">
              This will permanently delete your account and all associated data,
              including:
            </p>
            <ul className="list-disc list-inside mb-4 text-sm space-y-1">
              <li>All your submitted directories</li>
              <li>Your votes and interactions</li>
              <li>Your profile information</li>
              <li>All associated data</li>
            </ul>
            <div className="alert alert-error mb-4">
              <WarningTriangle className="w-5 h-5" />
              <span className="text-sm">
                This action cannot be undone. Please be certain.
              </span>
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">
                  Type <span className="font-bold">DELETE</span> to confirm
                </span>
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="input input-bordered w-full"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="btn btn-ghost"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteConfirmation !== "DELETE" || isDeleting
                }
                className="btn btn-error"
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Trash className="w-5 h-5 mr-2" />
                    Delete My Account
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
}

