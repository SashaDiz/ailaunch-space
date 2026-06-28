import { redirect } from "next/navigation";

// The marketing banner editor now lives under the consolidated Advertising page.
export default function MarketingRedirect() {
  redirect("/admin/advertising?tab=banner");
}
