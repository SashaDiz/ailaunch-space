import { redirect } from "next/navigation";

// Sponsors now live under the consolidated Advertising page.
export default function SponsorsRedirect() {
  redirect("/admin/advertising?tab=sponsors");
}
