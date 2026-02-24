import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/LoginScreen";

export const dynamic = "force-dynamic";

/**
 * Home page — if authenticated, redirect to the main app.
 * Otherwise show the login screen.
 */
export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/app");
  }

  return <LoginScreen />;
}
