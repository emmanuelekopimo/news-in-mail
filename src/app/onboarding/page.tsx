import { redirect } from "next/navigation";
import { PreferencesForm } from "@/components/PreferencesForm";
import { firstName } from "@/lib/text";
import { requireUser } from "@/server/auth";
import { userTopics } from "@/server/digest";

export const metadata = { title: "Set up your briefing" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/settings");
  const topics = await userTopics(user.id);
  return (
    <main className="page-narrow">
      <div className="brand" style={{ marginBottom: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={34} height={34} />
        <span><b>News</b> in Mail</span>
      </div>
      <div className="card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/onboarding.svg" alt="" width={320} height={160} style={{ width: "100%", maxWidth: 320, height: "auto" }} />
        <h1 style={{ fontSize: 26, marginTop: 12 }}>Welcome, {firstName(user.name)}</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Pick your topics and delivery times. When you finish we will send you a test email straight away so you can see what your briefings look like.
        </p>
        <PreferencesForm
          initial={{ topics: topics.length ? topics : ["nigeria", "world"], morningEnabled: true, morningTime: "07:00", eveningEnabled: true, eveningTime: "18:00", timezone: user.timezone }}
          submitLabel="Finish and send test email"
          pendingLabel="Sending your test email..."
        />
      </div>
    </main>
  );
}
