import { getRequiredUser } from "@/lib/auth-utils";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getRequiredUser();

  return <SettingsClient user={user} />;
}
