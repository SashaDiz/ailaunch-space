import { AppService } from "../../libs/models/services.js";
import { AppSchema } from "../../libs/models/schemas.js";
import formidable from "formidable";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check authentication - get user ID from headers set by Clerk
    const userId = req.headers["x-clerk-user-id"];

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Parse the form data using formidable
    const form = formidable({ multiples: true });
    const [fields, files] = await form.parse(req);

    // Extract and flatten form fields
    const appData = {};
    const screenshotFiles = [];

    // Process regular fields
    Object.keys(fields).forEach((key) => {
      const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];

      if (key === "categories") {
        try {
          appData[key] = JSON.parse(value);
        } catch {
          appData[key] = [value]; // Fallback if not JSON
        }
      } else {
        appData[key] = value;
      }
    });

    // Process files
    Object.keys(files).forEach((key) => {
      if (key.startsWith("screenshot_")) {
        const index = parseInt(key.split("_")[1]);
        screenshotFiles[index] = files[key];
      }
    });

    // Get the logo file
    const logoFile = files.logo_file;

    // For now, we'll handle file uploads by storing them as URLs
    // In a production environment, you'd upload to a service like AWS S3, Cloudinary, etc.

    // Validate required fields
    const requiredFields = [
      "name",
      "short_description",
      "full_description",
      "website_url",
      "categories",
      "pricing",
      "contact_email",
      "launch_week",
    ];

    for (const field of requiredFields) {
      if (!appData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Create a slug from the app name
    const slug = appData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Parse launch week to create launch date
    const [year, week] = appData.launch_week.split("-W");
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const weekNumber = parseInt(week);
    const daysToAdd = (weekNumber - 1) * 7;
    const launchDate = new Date(
      firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    // Find the first Monday of that week
    while (launchDate.getDay() !== 1) {
      launchDate.setDate(launchDate.getDate() + 1);
    }

    // Prepare the complete app data
    const completeAppData = {
      ...appData,
      slug,
      launch_date: launchDate,
      submitted_by: userId,
      status: "pending",
      featured: false,
      views: 0,
      upvotes: 0,
      downvotes: 0,
      clicks: 0,
      ranking_score: 0,
      // Handle logo URL - for now using the existing logo_url from form or placeholder
      logo_url: appData.logo_url || "https://via.placeholder.com/200x200",
      // Handle screenshots - for now using existing screenshot URLs or empty array
      screenshots: appData.screenshots
        ? JSON.parse(appData.screenshots).filter((url) => url && url.trim())
        : [],
      // Plan mapping
      plan:
        appData.plan === "standard_launch"
          ? "standard"
          : appData.plan === "premium_launch"
          ? "premium"
          : appData.plan === "support_launch"
          ? "support"
          : "standard",
    };

    // Add backlink URL for support plan
    if (appData.plan === "support_launch" && appData.backlink_url) {
      completeAppData.backlink_url = appData.backlink_url;
    }

    // Validate against schema
    try {
      AppSchema.parse(completeAppData);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return res.status(400).json({
        error: "Validation failed",
        details: validationError.errors,
      });
    }

    // Submit the app to the database
    const result = await AppService.submitApp(completeAppData, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      app: result.app,
      message: "Directory submitted successfully!",
    });
  } catch (error) {
    console.error("Error in POST /api/submit-directory:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
