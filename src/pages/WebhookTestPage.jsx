import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

export function WebhookTestPage() {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDbUser = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user/me", {
        headers: {
          "x-clerk-user-id": user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbUser(data.user);
      } else {
        console.error("Failed to fetch user from database");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDbUser();
  }, [fetchDbUser]);

  if (!user) {
    return <div>Please sign in to test webhook integration</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Webhook Integration Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clerk Data */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Clerk Data</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(
              {
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                imageUrl: user.imageUrl,
                publicMetadata: user.publicMetadata,
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Database Data */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Database Data</h2>
          {loading ? (
            <div>Loading...</div>
          ) : dbUser ? (
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(dbUser, null, 2)}
            </pre>
          ) : (
            <div className="text-red-600">
              User not found in database. Webhook may not be working.
            </div>
          )}

          <button
            onClick={fetchDbUser}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Database Data
          </button>
        </div>
      </div>
    </div>
  );
}
