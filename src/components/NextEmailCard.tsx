import { Send } from "lucide-react";
import type { User } from "@/db/schema";
import { formatTime12, nextDelivery } from "@/lib/schedule";
import { sendTestEmailAction } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function NextEmailCard({ user, at }: { user: User; at: Date }) {
  const next = nextDelivery(at, user);
  return (
    <section className="card next-card" data-testid="next-email">
      <div className="small muted">Next email</div>
      {next ? (
        <>
          <div className="big">{formatTime12(next.time)}</div>
          <div>
            {next.slot === "morning" ? "Morning" : "Evening"} briefing, {next.day}, to <b style={{ overflowWrap: "anywhere" }}>{user.email}</b>
          </div>
        </>
      ) : (
        <>
          <div className="big">Paused</div>
          <div>Briefings are paused. Turn them back on in Settings.</div>
        </>
      )}
      <form action={sendTestEmailAction} style={{ marginTop: 14 }}>
        <SubmitButton className="btn btn-outline" pending="Sending...">
          <Send size={16} aria-hidden /> Send a test email now
        </SubmitButton>
      </form>
    </section>
  );
}
