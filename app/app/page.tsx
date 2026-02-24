import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

/**
 * Protected main app page.
 * Redirects to login if not authenticated.
 */
export default async function AppPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <AppShell />;
}
