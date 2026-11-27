/**
 * Places makers can list an AI tool, shown on /launch-platforms with their
 * live Ahrefs Domain Rating. Every link on that page is nofollow.
 *
 * `domain` is what the Domain Rating is looked up for; `url` is where the
 * link goes. Keep entries to sites that accept submissions.
 */
export type LaunchPlatformType = "ai-directory" | "launch-platform" | "community";

export type LaunchPlatform = {
  name: string;
  domain: string;
  url: string;
  type: LaunchPlatformType;
  /** One short line on what it is, for makers deciding where to go. */
  note: string;
};

export const LAUNCH_PLATFORM_TYPES: Record<LaunchPlatformType, string> = {
  "ai-directory": "AI directory",
  "launch-platform": "Launch platform",
  community: "Community",
};

export const launchPlatforms: LaunchPlatform[] = [
  // AI tool directories
  { name: "There's An AI For That", domain: "theresanaiforthat.com", url: "https://theresanaiforthat.com/", type: "ai-directory", note: "Large AI tool directory organised by task" },
  { name: "Futurepedia", domain: "futurepedia.io", url: "https://www.futurepedia.io/", type: "ai-directory", note: "AI tools directory with reviews and tutorials" },
  { name: "Toolify", domain: "toolify.ai", url: "https://www.toolify.ai/", type: "ai-directory", note: "AI tools directory with traffic rankings" },
  { name: "Future Tools", domain: "futuretools.io", url: "https://www.futuretools.io/", type: "ai-directory", note: "Curated AI tools list with a weekly newsletter" },
  { name: "TopAI.tools", domain: "topai.tools", url: "https://topai.tools/", type: "ai-directory", note: "AI tools directory with alternatives pages" },
  { name: "AI Tools Directory", domain: "aitoolsdirectory.com", url: "https://aitoolsdirectory.com/", type: "ai-directory", note: "Categorised AI tools directory" },
  { name: "Easy With AI", domain: "easywithai.com", url: "https://easywithai.com/", type: "ai-directory", note: "AI tools directory and guides" },
  { name: "OpenTools", domain: "opentools.ai", url: "https://opentools.ai/", type: "ai-directory", note: "AI tools directory with AI news" },
  { name: "AIcyclopedia", domain: "aicyclopedia.com", url: "https://www.aicyclopedia.com/", type: "ai-directory", note: "AI tools and prompts directory" },
  { name: "AI Valley", domain: "aivalley.ai", url: "https://aivalley.ai/", type: "ai-directory", note: "AI tools directory with a newsletter" },
  { name: "SaaS AI Tools", domain: "saasaitools.com", url: "https://saasaitools.com/", type: "ai-directory", note: "Directory of AI SaaS tools" },
  { name: "Dang.ai", domain: "dang.ai", url: "https://dang.ai/", type: "ai-directory", note: "AI tools directory" },
  { name: "Aitoolnet", domain: "aitoolnet.com", url: "https://www.aitoolnet.com/", type: "ai-directory", note: "AI tools directory" },
  { name: "Toolpilot", domain: "toolpilot.ai", url: "https://www.toolpilot.ai/", type: "ai-directory", note: "AI tools directory" },

  // Launch platforms
  { name: "Product Hunt", domain: "producthunt.com", url: "https://www.producthunt.com/", type: "launch-platform", note: "The best-known daily launch leaderboard" },
  { name: "DevHunt", domain: "devhunt.org", url: "https://devhunt.org/", type: "launch-platform", note: "Weekly launches of developer tools" },
  { name: "Uneed", domain: "uneed.best", url: "https://www.uneed.best/", type: "launch-platform", note: "Daily launches with a waiting line" },
  { name: "Peerlist Launchpad", domain: "peerlist.io", url: "https://peerlist.io/", type: "launch-platform", note: "Weekly launchpad on a professional network" },
  { name: "BetaList", domain: "betalist.com", url: "https://betalist.com/", type: "launch-platform", note: "Early-stage startups looking for beta users" },
  { name: "Fazier", domain: "fazier.com", url: "https://fazier.com/", type: "launch-platform", note: "Daily launches for indie products" },
  { name: "Microlaunch", domain: "microlaunch.net", url: "https://microlaunch.net/", type: "launch-platform", note: "Month-long launches for small products" },
  { name: "TinyLaunch", domain: "tinylaunch.com", url: "https://www.tinylaunch.com/", type: "launch-platform", note: "Weekly launches for small projects" },
  { name: "Launching Next", domain: "launchingnext.com", url: "https://www.launchingnext.com/", type: "launch-platform", note: "New startups listed daily" },
  { name: "StartupBase", domain: "startupbase.io", url: "https://startupbase.io/", type: "launch-platform", note: "Startup launches and directory" },
  { name: "Twelve Tools", domain: "twelve.tools", url: "https://twelve.tools/", type: "launch-platform", note: "Twelve product launches a week" },
  { name: "SaaSHub", domain: "saashub.com", url: "https://www.saashub.com/", type: "launch-platform", note: "Software alternatives and reviews" },
  { name: "AlternativeTo", domain: "alternativeto.net", url: "https://alternativeto.net/", type: "launch-platform", note: "Crowd-sourced software alternatives" },

  // Communities
  { name: "Hacker News (Show HN)", domain: "ycombinator.com", url: "https://news.ycombinator.com/show", type: "community", note: "Show HN posts on Hacker News" },
  { name: "Indie Hackers", domain: "indiehackers.com", url: "https://www.indiehackers.com/", type: "community", note: "Community of bootstrapped founders" },
];
