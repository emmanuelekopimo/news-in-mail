"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { savePreferencesAction, type FormState } from "@/app/actions";
import { TOPICS } from "@/lib/topics";
import { TIMEZONES } from "@/lib/validation";
import { SubmitButton } from "./SubmitButton";
import { TopicIcon } from "./TopicIcon";

export type PrefValues = {
  topics: string[];
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  timezone: string;
};

function times(fromHour: number, toHour: number) {
  const list: string[] = [];
  for (let h = fromHour; h <= toHour; h++) {
    for (const m of ["00", "30"]) list.push(`${String(h).padStart(2, "0")}:${m}`);
  }
  return list;
}

function label12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const MORNING = times(5, 11);
const EVENING = times(12, 22);

export function PreferencesForm({ initial, submitLabel, pendingLabel }: { initial: PrefValues; submitLabel: string; pendingLabel: string }) {
  const [state, action] = useActionState<FormState, FormData>(savePreferencesAction, {});
  const v = { ...initial, ...((state.values ?? {}) as Partial<PrefValues>) };
  const err = state.errors ?? {};

  return (
    <form action={action} noValidate>
      {state.ok && state.message ? <div className="alert alert-success" role="status">{state.message}</div> : null}
      {state.errors ? <div className="alert alert-error" role="alert">Please fix the highlighted fields.</div> : null}

      <fieldset className="form-section" style={{ border: 0, padding: 0, margin: "28px 0 0" }}>
        <legend><h2>Topics</h2></legend>
        <p className="small muted" style={{ margin: "0 0 14px" }}>Pick the subjects you want in your briefings.</p>
        <div className="topic-picker">
          {TOPICS.map((t) => (
            <label key={t.id} className="topic-option">
              <input type="checkbox" name="topics" value={t.id} defaultChecked={v.topics.includes(t.id)} aria-label={t.label} />
              <span>
                <TopicIcon topic={t.id} size={18} color={t.color} />
                {t.label}
                <Check className="check" size={16} aria-hidden />
              </span>
            </label>
          ))}
        </div>
        {err.topics ? <p className="error" role="alert">{err.topics[0]}</p> : null}
      </fieldset>

      <div className="form-section">
        <h2>Delivery times</h2>
        <p>We send at most two emails a day.</p>
        <div className="slot-row">
          <label className="switch">
            <input type="checkbox" name="morningEnabled" defaultChecked={v.morningEnabled} />
            <span><b>Morning briefing</b><small>What happened overnight</small></span>
          </label>
          <div>
            <label htmlFor="morningTime" className="sr-only">Morning time</label>
            <select id="morningTime" name="morningTime" className="select" defaultValue={v.morningTime} aria-invalid={Boolean(err.morningTime)}>
              {MORNING.map((t) => <option key={t} value={t}>{label12(t)}</option>)}
            </select>
          </div>
        </div>
        {err.morningEnabled ? <p className="error" role="alert">{err.morningEnabled[0]}</p> : null}
        {err.morningTime ? <p className="error">{err.morningTime[0]}</p> : null}
        <div className="slot-row">
          <label className="switch">
            <input type="checkbox" name="eveningEnabled" defaultChecked={v.eveningEnabled} />
            <span><b>Evening briefing</b><small>Catch up on the day</small></span>
          </label>
          <div>
            <label htmlFor="eveningTime" className="sr-only">Evening time</label>
            <select id="eveningTime" name="eveningTime" className="select" defaultValue={v.eveningTime} aria-invalid={Boolean(err.eveningTime)}>
              {EVENING.map((t) => <option key={t} value={t}>{label12(t)}</option>)}
            </select>
          </div>
        </div>
        {err.eveningTime ? <p className="error">{err.eveningTime[0]}</p> : null}
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="timezone">Time zone</label>
          <select id="timezone" name="timezone" className="select" defaultValue={v.timezone} aria-invalid={Boolean(err.timezone)}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", " ")}</option>)}
          </select>
          {err.timezone ? <p className="error">{err.timezone[0]}</p> : null}
        </div>
      </div>

      <div className="form-foot">
        <SubmitButton pending={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
