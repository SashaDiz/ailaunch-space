import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseSession } from "../hooks/useSupabaseSession";

// Example component showing how to integrate Supabase Auth with MongoDB data
export function ExampleAppList() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useSupabaseSession();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch apps from MongoDB API
      const appsResponse = await fetch("/api/apps?limit=10");

      if (!appsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const appsData = await appsResponse.json();
      setApps(appsData.apps || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (appSlug, voteType) => {
    // Check if user is authenticated via Supabase
    if (!session?.user) {
      alert("Please sign in to vote");
      return;
    }

    try {
      const response = await fetch(`/api/apps/${appSlug}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass Supabase user ID to your MongoDB API
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vote_type: voteType,
          user_id: session.user.id, // Supabase user ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      // Refresh the apps list to show updated vote counts
      fetchData();
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Featured Apps</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Card key={app._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <img
                  src={app.logo_url}
                  alt={`${app.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {app.short_description}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {app.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-xs"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{app.views} views</span>
                  <span>{app.upvotes} upvotes</span>
                  <Badge variant="outline">{app.pricing}</Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVote(app.slug, "upvote")}
                    className="flex-1"
                  >
                    👍 Upvote ({app.upvotes})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(app.website_url, "_blank")}
                    className="flex-1"
                  >
                    Visit Site
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {apps.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No apps found. Be the first to submit one!
        </div>
      )}
    </div>
  );
}

export default ExampleAppList;
