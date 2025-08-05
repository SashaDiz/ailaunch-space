import { AppService } from "../../../../libs/models/services.js";
import { auth } from "../../../../auth.mjs";

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const session = await auth();

    const result = await AppService.getAppDetails(slug, session?.user?.id);

    if (!result.success) {
      const status = result.error === "App not found" ? 404 : 500;
      return new Response(JSON.stringify({ error: result.error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/apps/[slug]:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
