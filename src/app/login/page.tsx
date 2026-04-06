import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginClient } from "@/components/auth/LoginClient";

export default async function LoginPage() {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/");
  }

  const isDev = process.env.NODE_ENV === "development";

  return <LoginClient showTestLogin={isDev} />;
}
