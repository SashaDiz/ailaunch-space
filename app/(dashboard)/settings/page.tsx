"use client";

import React, { useState, useEffect } from "react";
import { useUser } from '@/hooks/use-user';
import { useRouter } from "next/navigation";
import { useSupabase } from '@/components/shared/SupabaseProvider';
import {
  Trash2,
  Link as LinkIcon,
  AlertTriangle,
  Bell,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [connectedProviders, setConnectedProviders] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLinking, setIsLinking] = useState<Record<string, boolean>>({});
  
  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    account_creation: true,
    account_deletion: true,
    submission_received: true,
    submission_approval: true,
    submission_decline: true,
    weekly_digest: true,
    marketing_emails: true
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) {
      router.push("/auth/signin?callbackUrl=/settings");
      return;
    }

    // Get connected providers from user metadata
    fetchConnectedProviders();
    
    // Get notification preferences
    fetchNotificationPreferences();
  }, [user?.id, authLoading, router]);

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
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when user doesn't exist

      if (error) {
        // Only log if it's a real error (not just "no rows found" which maybeSingle handles gracefully)
        // PGRST116 is "no rows found" which is expected for new users
        if (error.code !== 'PGRST116') {
          console.warn("Could not fetch notification preferences, using defaults:", error.message || error);
        }
        // Keep default preferences that are already set in state
        return;
      }

      // If user exists and has preferences, merge with defaults to ensure all keys exist
      if (data?.notification_preferences) {
        setNotificationPreferences(prev => ({
          ...prev,
          ...data.notification_preferences
        }));
      }
      // If data is null (user doesn't exist in public.users yet), keep default preferences
    } catch (error) {
      // Handle unexpected errors silently - just use defaults
      console.warn("Failed to fetch notification preferences, using defaults");
    }
  };

  const updateNotificationPreferences = async () => {
    if (!user) return;

    setIsUpdatingNotifications(true);
    try {
      // Ensure mandatory notifications are always enabled
      // These match the server-side mandatoryNotifications in notification-service.js
      const mandatoryNotifications = [
        'account_creation',
        'account_deletion',
        'submission_received',
        'submission_approval',
        'submission_decline',
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
    // These match the server-side mandatoryNotifications in notification-service.js
    const mandatoryNotifications = [
      'account_creation',
      'account_deletion',
      'submission_received',
      'submission_approval',
      'submission_decline',
      'launch_week_reminder'       // Users in current launch week - cannot disable
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
      await fetch("/api/auth/signout", {
        method: "POST",
        cache: "no-store",
      });
      
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
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  const isProviderConnected = (provider) => {
    return connectedProviders.some((p) => p.provider === provider);
  };


  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-classic py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Account Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your connected accounts, notification preferences, and account security.
          </p>
        </div>

        {/* Notification Preferences Section */}
        <div className="rounded-[var(--radius)] border border-border bg-card mb-8" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-foreground/10 rounded-[var(--radius)] flex items-center justify-center">
                <Bell className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Email Notifications</h2>
                <p className="text-muted-foreground text-sm">
                  Manage your email notification preferences. Some notifications are required and cannot be disabled.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Optional Notifications */}
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-foreground/60 rounded-full"></div>
                  Optional Updates
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-[var(--radius)] border border-border hover:border-foreground/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Weekly Digest</h4>
                      <p className="text-sm text-muted-foreground mt-1">Weekly summary of {siteConfig.name} activity</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.weekly_digest}
                        onChange={() => toggleNotificationPreference('weekly_digest')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.weekly_digest ? 'bg-foreground' : 'bg-muted'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                          notificationPreferences.weekly_digest ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted rounded-[var(--radius)] border border-border hover:border-foreground/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground mt-1">Product updates and promotional content</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notificationPreferences.marketing_emails}
                        onChange={() => toggleNotificationPreference('marketing_emails')}
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPreferences.marketing_emails ? 'bg-foreground' : 'bg-muted'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                          notificationPreferences.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={updateNotificationPreferences}
                  disabled={isUpdatingNotifications}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-background text-foreground border-2 border-foreground font-semibold text-sm rounded-[var(--radius)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isUpdatingNotifications ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
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
        <div className="rounded-[var(--radius)] border border-border bg-card mb-8" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-foreground/10 rounded-[var(--radius)] flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Connected Accounts</h2>
                <p className="text-muted-foreground text-sm">
                  Link multiple accounts to sign in with different providers for enhanced security.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Google */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-[var(--radius)] border border-border hover:border-foreground/30 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border">
                    {getProviderIcon("google")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Google</h3>
                    {isProviderConnected("google") ? (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <p className="text-sm text-success font-medium">Connected</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Not connected</p>
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/30 rounded-lg hover:bg-destructive/10 hover:border-destructive/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={connectedProviders.length === 1}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleLinkProvider("google")}
                    disabled={isLinking.google}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-foreground/10 border border-foreground/20 rounded-lg hover:bg-foreground/20 hover:border-foreground/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLinking.google ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
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
              <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-[var(--radius)]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
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
        <div className="rounded-[var(--radius)] border border-destructive/30 bg-card" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-destructive/10 rounded-[var(--radius)] flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-[var(--radius)] mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Warning: This action is irreversible</p>
                  <p className="text-sm text-destructive mt-1">
                    Deleting your account will permanently remove all your data, including projects and profile information.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-destructive-foreground font-semibold text-sm bg-destructive rounded-[var(--radius)] hover:bg-destructive/90 transition duration-300"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
              }
            }}
          />
          <div className="relative bg-card rounded-[var(--radius)] border border-border shadow-xl max-w-md w-full p-6" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-destructive/10 rounded-[var(--radius)] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-destructive">Delete Account</h3>
                <p className="text-muted-foreground text-sm">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                This will permanently delete your account and all associated data, including:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"></div>
                  All your submitted projects
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"></div>
                  Your interactions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"></div>
                  Your profile information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"></div>
                  All associated data
                </li>
              </ul>
            </div>

            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-[var(--radius)] mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Final Warning</p>
                  <p className="text-sm text-destructive mt-1">
                    This action cannot be undone. Please be certain before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Type <span className="font-bold text-destructive">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:border-red-500 transition-colors"
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
                className="flex-1 px-4 py-3 text-muted-foreground font-medium bg-muted rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-destructive-foreground font-semibold text-sm bg-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
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

