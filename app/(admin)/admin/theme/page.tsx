import { redirect } from "next/navigation";

// Theme editing now lives under the consolidated Design page.
export default function ThemeRedirect() {
  redirect("/admin/design");
}
