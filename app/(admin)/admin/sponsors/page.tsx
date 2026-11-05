import { redirect } from "next/navigation";

// Sponsors are now the Homepage Logo placement of a promotion.
export default function SponsorsRedirect() {
  redirect("/admin/advertising?tab=promotions");
}
