import { Pause, Play } from "lucide-react";
import { setPausedAction } from "@/app/actions";
import { NextEmailCard } from "@/components/NextEmailCard";
import { PreferencesForm } from "@/components/PreferencesForm";
import { SubmitButton } from "@/components/SubmitButton";
import { now } from "@/lib/today";
import { requireUser } from "@/server/auth";
import { userTopics } from "@/server/digest";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const topics = await userTopics(user.id);
  return (
    <main className="page" style={{ maxWidth: 900 }}>
      <div className="briefing-head">
        <div>
          <h1>Settings</h1>
          <p>Change your topics and when your briefings arrive.</p>
        </div>
      </div>
      <div className="home-grid">
        <section className="card">
          <PreferencesForm
            initial={{ topics, morningEnabled: user.morningEnabled, morningTime: user.morningTime, eveningEnabled: user.eveningEnabled, eveningTime: user.eveningTime, timezone: user.timezone }}
            submitLabel="Save changes"
            pendingLabel="Saving..."
          />
        </section>
        <aside>
          <NextEmailCard user={user} at={now()} />
          <section className="card">
            <div className="card-title" style={{ fontSize: 16 }}>{user.paused ? "Briefings are paused" : "Pause briefings"}</div>
            <p className="small muted" style={{ marginTop: 0 }}>
              {user.paused ? "You will not get any emails until you resume." : "Going on holiday? Pause all emails and resume any time."}
            </p>
            <form action={setPausedAction}>
              <input type="hidden" name="paused" value={user.paused ? "0" : "1"} />
              <SubmitButton className={user.paused ? "btn btn-primary" : "btn btn-danger"} pending="Saving...">
                {user.paused ? <><Play size={16} aria-hidden /> Resume briefings</> : <><Pause size={16} aria-hidden /> Pause briefings</>}
              </SubmitButton>
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
