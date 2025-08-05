import { AppService } from "../../../../../libs/models/services.js";
import { verifySupabaseToken } from "../../../middleware/auth.js";

export async function POST(request, { params }) {
  try {
    // Verify Supabase authentication
    const user = await verifySupabaseToken(request);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { slug } = params;
    const { vote_type } = await request.json();

    if (!["upvote", "downvote"].includes(vote_type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid vote type. Must be 'upvote' or 'downvote'",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // First get the app by slug to get the ID
    const appResult = await AppService.getAppDetails(slug);
    if (!appResult.success) {
      return new Response(JSON.stringify({ error: "App not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await AppService.voteForApp(
      user.id, // Use Supabase user ID
      appResult.app._id.toString(),
      vote_type
    );

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/apps/[slug]/vote:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
