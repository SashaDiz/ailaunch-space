import { db } from "../database.js";
import { CategoryRepository } from "./repositories.js";

// Predefined categories from your SubmitAppPage.jsx
export const DEFAULT_CATEGORIES = [
  {
    name: "Directory of Directories",
    slug: "directory-of-directories",
    description: "Collections and directories of other directories",
    icon: "🗂️",
    color: "#8B5CF6",
    sort_order: 1,
    featured: true,
  },
  {
    name: "AI & LLM",
    slug: "ai-llm",
    description: "Artificial Intelligence and Large Language Model tools",
    icon: "🤖",
    color: "#06B6D4",
    sort_order: 2,
    featured: true,
  },
  {
    name: "Developer Tools & Platforms",
    slug: "developer-tools-platforms",
    description: "Tools and platforms for developers",
    icon: "⚡",
    color: "#10B981",
    sort_order: 3,
    featured: true,
  },
  {
    name: "UI/UX",
    slug: "ui-ux",
    description: "User Interface and User Experience tools",
    icon: "🎨",
    color: "#F59E0B",
    sort_order: 4,
    featured: true,
  },
  {
    name: "Design",
    slug: "design",
    description: "Design tools and resources",
    icon: "✨",
    color: "#EF4444",
    sort_order: 5,
    featured: false,
  },
  {
    name: "APIs & Integrations",
    slug: "apis-integrations",
    description: "APIs and integration platforms",
    icon: "🔌",
    color: "#6366F1",
    sort_order: 6,
    featured: false,
  },
  {
    name: "SaaS Tools",
    slug: "saas-tools",
    description: "Software as a Service applications",
    icon: "☁️",
    color: "#14B8A6",
    sort_order: 7,
    featured: true,
  },
  {
    name: "E-commerce",
    slug: "e-commerce",
    description: "Online commerce and marketplace tools",
    icon: "🛒",
    color: "#F97316",
    sort_order: 8,
    featured: false,
  },
  {
    name: "Marketing & SEO",
    slug: "marketing-seo",
    description: "Marketing and Search Engine Optimization tools",
    icon: "📈",
    color: "#84CC16",
    sort_order: 9,
    featured: true,
  },
  {
    name: "Analytics & Data",
    slug: "analytics-data",
    description: "Data analytics and business intelligence tools",
    icon: "📊",
    color: "#3B82F6",
    sort_order: 10,
    featured: false,
  },
  {
    name: "Social Media",
    slug: "social-media",
    description: "Social media management and tools",
    icon: "📱",
    color: "#EC4899",
    sort_order: 11,
    featured: false,
  },
  {
    name: "Content Management",
    slug: "content-management",
    description: "Content management systems and tools",
    icon: "📝",
    color: "#8B5CF6",
    sort_order: 12,
    featured: false,
  },
  {
    name: "Productivity",
    slug: "productivity",
    description: "Productivity and workflow optimization tools",
    icon: "⚡",
    color: "#059669",
    sort_order: 13,
    featured: true,
  },
  {
    name: "Finance & Business",
    slug: "finance-business",
    description: "Financial and business management tools",
    icon: "💰",
    color: "#DC2626",
    sort_order: 14,
    featured: false,
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    description: "Health and wellness applications",
    icon: "🏥",
    color: "#16A34A",
    sort_order: 15,
    featured: false,
  },
  {
    name: "Education & Learning",
    slug: "education-learning",
    description: "Educational tools and learning platforms",
    icon: "📚",
    color: "#2563EB",
    sort_order: 16,
    featured: false,
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    description: "Entertainment and gaming applications",
    icon: "🎮",
    color: "#7C3AED",
    sort_order: 17,
    featured: false,
  },
  {
    name: "News & Media",
    slug: "news-media",
    description: "News and media platforms",
    icon: "📰",
    color: "#1F2937",
    sort_order: 18,
    featured: false,
  },
  {
    name: "Travel & Lifestyle",
    slug: "travel-lifestyle",
    description: "Travel and lifestyle applications",
    icon: "✈️",
    color: "#0891B2",
    sort_order: 19,
    featured: false,
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    description: "Real estate and property tools",
    icon: "🏠",
    color: "#B45309",
    sort_order: 20,
    featured: false,
  },
  {
    name: "Job Boards",
    slug: "job-boards",
    description: "Job search and recruitment platforms",
    icon: "💼",
    color: "#374151",
    sort_order: 21,
    featured: false,
  },
  {
    name: "Community & Forums",
    slug: "community-forums",
    description: "Community platforms and discussion forums",
    icon: "👥",
    color: "#6B7280",
    sort_order: 22,
    featured: false,
  },
  {
    name: "Marketplaces",
    slug: "marketplaces",
    description: "Digital marketplaces and platforms",
    icon: "🏪",
    color: "#9CA3AF",
    sort_order: 23,
    featured: false,
  },
  {
    name: "Security & Privacy",
    slug: "security-privacy",
    description: "Security and privacy protection tools",
    icon: "🔒",
    color: "#EF4444",
    sort_order: 24,
    featured: false,
  },
  {
    name: "Mobile Apps",
    slug: "mobile-apps",
    description: "Mobile applications and tools",
    icon: "📱",
    color: "#8B5CF6",
    sort_order: 25,
    featured: false,
  },
  {
    name: "Web Apps",
    slug: "web-apps",
    description: "Web-based applications",
    icon: "🌐",
    color: "#06B6D4",
    sort_order: 26,
    featured: false,
  },
  {
    name: "Chrome Extensions",
    slug: "chrome-extensions",
    description: "Google Chrome browser extensions",
    icon: "🔗",
    color: "#10B981",
    sort_order: 27,
    featured: false,
  },
  {
    name: "WordPress Plugins",
    slug: "wordpress-plugins",
    description: "WordPress plugins and themes",
    icon: "📌",
    color: "#F59E0B",
    sort_order: 28,
    featured: false,
  },
  {
    name: "Template Libraries",
    slug: "template-libraries",
    description: "Design templates and libraries",
    icon: "📋",
    color: "#EF4444",
    sort_order: 29,
    featured: false,
  },
  {
    name: "Stock Resources",
    slug: "stock-resources",
    description: "Stock photos, videos, and digital resources",
    icon: "📸",
    color: "#6366F1",
    sort_order: 30,
    featured: false,
  },
];

export async function seedCategories() {
  try {
    console.log("🌱 Seeding categories...");

    // Check if categories already exist
    const existingCategories = await CategoryRepository.getCategories();
    if (existingCategories.length > 0) {
      console.log("✅ Categories already exist, skipping seed");
      return existingCategories;
    }

    // Insert all categories
    const categoriesWithTimestamps = DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      app_count: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insertMany("categories", categoriesWithTimestamps);

    console.log(
      `✅ Successfully seeded ${DEFAULT_CATEGORIES.length} categories`
    );
    return categoriesWithTimestamps;
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}

export async function seedLaunchWeeks() {
  try {
    console.log("🗓️ Creating initial launch weeks...");

    const currentDate = new Date();
    const weeks = [];

    // Create 12 weeks: 4 past, current, 7 future
    for (let i = -4; i <= 7; i++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() + i * 7);

      // Set to Monday of the week
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart.setDate(weekStart.getDate() + daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const year = weekStart.getFullYear();
      const weekNumber = Math.ceil(
        ((weekStart - new Date(year, 0, 1)) / 86400000 + 1) / 7
      );
      const weekId = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

      let status = "upcoming";
      if (weekEnd < currentDate) {
        status = "completed";
      } else if (weekStart <= currentDate && weekEnd >= currentDate) {
        status = "active";
      }

      weeks.push({
        week_id: weekId,
        start_date: weekStart,
        end_date: weekEnd,
        status,
        featured_apps: [],
        total_submissions: 0,
        total_votes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Check if launch weeks already exist
    const existingWeeks = await db.find("launch_weeks", {});
    if (existingWeeks.length > 0) {
      console.log("✅ Launch weeks already exist, skipping seed");
      return existingWeeks;
    }

    await db.insertMany("launch_weeks", weeks);

    console.log(`✅ Successfully created ${weeks.length} launch weeks`);
    return weeks;
  } catch (error) {
    console.error("❌ Error creating launch weeks:", error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database...");

    // Connect to database
    await db.connect();
    console.log("✅ Connected to MongoDB");

    // Create indexes for better performance
    await createIndexes();

    // Seed initial data
    await seedCategories();
    await seedLaunchWeeks();

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

async function createIndexes() {
  console.log("📊 Creating database indexes...");

  try {
    // User indexes
    await db.createIndex("users", { email: 1 }, { unique: true });

    // App indexes
    await db.createIndex("apps", { slug: 1 }, { unique: true });
    await db.createIndex("apps", { submitted_by: 1 });
    await db.createIndex("apps", { status: 1 });
    await db.createIndex("apps", { launch_week: 1 });
    await db.createIndex("apps", { categories: 1 });
    await db.createIndex("apps", { featured: 1 });
    await db.createIndex("apps", { ranking_score: -1 });
    await db.createIndex("apps", { createdAt: -1 });

    // Compound indexes for common queries
    await db.createIndex("apps", { status: 1, ranking_score: -1 });
    await db.createIndex("apps", { launch_week: 1, ranking_score: -1 });
    await db.createIndex("apps", { categories: 1, status: 1 });

    // Vote indexes
    await db.createIndex("votes", { user_id: 1, app_id: 1 }, { unique: true });
    await db.createIndex("votes", { app_id: 1 });
    await db.createIndex("votes", { user_id: 1 });

    // Launch week indexes
    await db.createIndex("launch_weeks", { week_id: 1 }, { unique: true });
    await db.createIndex("launch_weeks", { start_date: 1 });
    await db.createIndex("launch_weeks", { status: 1 });

    // Category indexes
    await db.createIndex("categories", { slug: 1 }, { unique: true });
    await db.createIndex("categories", { sort_order: 1 });

    // Analytics indexes
    await db.createIndex("analytics", { app_id: 1, date: 1 }, { unique: true });
    await db.createIndex("analytics", { date: 1 });

    // Payment indexes
    await db.createIndex("payments", { user_id: 1 });
    await db.createIndex("payments", { payment_id: 1 });

    // Newsletter indexes
    await db.createIndex("newsletters", { email: 1 }, { unique: true });

    console.log("✅ Database indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  }
}
