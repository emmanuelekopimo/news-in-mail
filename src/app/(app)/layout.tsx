import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { now } from "@/lib/today";
import { requireUser } from "@/server/auth";
import { userTopics } from "@/server/digest";
import { countDigestsSince } from "@/server/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding");
  const [followed, unread] = await Promise.all([
    userTopics(user.id),
    countDigestsSince(user.id, new Date(now().getTime() - 12 * 3_600_000)),
  ]);
  return (
    <>
      <AppHeader user={user} followed={followed} unread={unread} />
      {children}
    </>
  );
}
