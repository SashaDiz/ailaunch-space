import { CategoryRepository } from "../../../libs/models/repositories.js";

export async function GET(request) {
  try {
    const categories = await CategoryRepository.getCategories();

    return new Response(JSON.stringify({ success: true, categories }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/categories:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
