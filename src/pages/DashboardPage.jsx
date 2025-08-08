import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Calendar,
  Edit3,
  Trash2,
  MoreHorizontal,
  Eye,
  Star,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BarChart3,
  Settings,
} from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [launches, setLaunches] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLaunches: 0,
    upcomingLaunches: 0,
    totalViews: 0,
    totalUpvotes: 0,
  });

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!isLoaded) return; // Wait for Clerk to load

    if (!user) {
      navigate("/sign-in");
      return;
    }

    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/dashboard", {
          headers: {
            "x-clerk-user-id": user.id,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setLaunches(result.data.apps || []);
            setStats({
              totalLaunches: result.data.stats.totalApps || 0,
              upcomingLaunches:
                result.data.apps?.filter((app) => app.status === "pending")
                  .length || 0,
              totalViews: result.data.stats.totalViews || 0,
              totalUpvotes: result.data.stats.totalUpvotes || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [user, isLoaded, navigate]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      live: {
        variant: "default",
        label: "Live",
        icon: CheckCircle,
        color: "text-green-600",
      },
      scheduled: {
        variant: "secondary",
        label: "Scheduled",
        icon: Clock,
        color: "text-blue-600",
      },
      draft: {
        variant: "outline",
        label: "Draft",
        icon: Edit3,
        color: "text-gray-600",
      },
      under_review: {
        variant: "secondary",
        label: "Under Review",
        icon: AlertCircle,
        color: "text-yellow-600",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canEdit = (launch) => {
    return launch.status === "draft" || launch.status === "scheduled";
  };

  const canDelete = (launch) => {
    return launch.status === "draft" || launch.status === "scheduled";
  };

  const handleEdit = (launchId) => {
    navigate(`/submit?edit=${launchId}`);
  };

  const handleDelete = async (launchId) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/apps/${launchId}`, {
        method: "DELETE",
        headers: {
          "x-clerk-user-id": user.id,
        },
      });

      if (response.ok) {
        setLaunches((prev) => prev.filter((l) => l._id !== launchId));
        // Update stats
        setStats((prev) => ({
          ...prev,
          totalLaunches: prev.totalLaunches - 1,
          upcomingLaunches: Math.max(0, prev.upcomingLaunches - 1),
        }));
      } else {
        const result = await response.json();
        alert(`Failed to delete app: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting app:", error);
      alert("Failed to delete app. Please try again.");
    }
  };

  const handleDuplicate = (launch) => {
    navigate(`/submit?duplicate=${launch._id}`);
  };

  const upcomingLaunches = launches.filter(
    (l) =>
      l.status === "scheduled" ||
      l.status === "draft" ||
      l.status === "under_review"
  );
  const pastLaunches = launches.filter((l) => l.status === "live");

  if (!isLoaded || dashboardLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your directory submissions and track performance
          </p>
        </div>
        <Button
          onClick={() => navigate("/submit")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Launch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Launches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalLaunches}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.upcomingLaunches}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Upvotes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUpvotes}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Launches Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming & Drafts ({upcomingLaunches.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Past Launches ({pastLaunches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingLaunches.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No upcoming launches
                </h3>
                <p className="text-gray-600 mb-4">
                  You don't have any scheduled launches or drafts. Start by
                  creating your first submission.
                </p>
                <Button onClick={() => navigate("/submit")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Launch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingLaunches.map((launch) => (
                <Card key={launch._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {launch.image && (
                          <img
                            src={launch.image}
                            alt={launch.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {launch.name}
                            </h3>
                            {getStatusBadge(launch.status)}
                            {launch.featured && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {launch.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Launch: {formatDate(launch.launchDate)}
                            </div>
                            <div className="flex items-center">
                              <Badge variant="outline" className="text-xs">
                                {launch.category}
                              </Badge>
                            </div>
                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {launch.plan?.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit(launch) && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(launch._id)}
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(launch)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {launch.website && (
                            <DropdownMenuItem asChild>
                              <a
                                href={launch.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Visit Website
                              </a>
                            </DropdownMenuItem>
                          )}
                          {canDelete(launch) && (
                            <>
                              <DropdownMenuItem
                                className="text-red-600"
                                asChild
                              >
                                <AlertDialog>
                                  <AlertDialogTrigger className="flex w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Launch
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "
                                        {launch.name}"? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(launch._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastLaunches.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <CheckCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No past launches
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't launched any projects yet. Your completed launches
                  will appear here.
                </p>
                <Button onClick={() => navigate("/submit")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastLaunches.map((launch) => (
                <Card key={launch.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {launch.image && (
                          <img
                            src={launch.image}
                            alt={launch.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {launch.name}
                            </h3>
                            {getStatusBadge(launch.status)}
                            {launch.featured && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {launch.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Launched: {formatDate(launch.launchDate)}
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {launch.views.toLocaleString()} views
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {launch.upvotes} upvotes
                            </div>
                            <div className="flex items-center">
                              <Badge variant="outline" className="text-xs">
                                {launch.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/app/${launch.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(launch)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          {launch.website && (
                            <DropdownMenuItem asChild>
                              <a
                                href={launch.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Visit Website
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
