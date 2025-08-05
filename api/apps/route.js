import { AppService } from "../../../libs/models/services.js";
import { auth } from "../../../auth.mjs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const week = searchParams.get("week");

    const filters = {
      status: "approved", // Only show approved apps
    };

    if (category) filters.category = category;
    if (search) filters.search = search;
    if (featured) filters.featured = true;
    if (week) filters.week = week;

    const result = await AppService.getApps(page, limit, filters);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/apps:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "short_description",
      "full_description",
      "website_url",
      "logo_url",
      "categories",
      "pricing",
      "contact_email",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({ error: `${field} is required` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const result = await AppService.submitApp(body, session.user.id);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/apps:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
