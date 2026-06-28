import { redirect } from "next/navigation";

// Promotions now live under the consolidated Advertising page.
export default function PromotionsRedirect() {
  redirect("/admin/advertising?tab=promotions");
}
