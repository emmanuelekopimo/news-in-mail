import { Clock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? "/news" : "/onboarding");
  return (
    <main>
      <div className="landing-top">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span><b>News</b> in Mail</span>
        </Link>
        <Link href="/sign-in" className="btn btn-outline">Sign in</Link>
      </div>
      <section className="hero">
        <div>
          <h1>Your news, summarized and sent to your inbox twice a day</h1>
          <p>Pick the topics you care about. Every morning and evening we read free news sources, pick the important stories and email you a short summary of each one.</p>
          <div className="toolbar">
            <Link href="/sign-up" className="btn btn-primary">Create a free account</Link>
            <Link href="/sign-in" className="btn btn-outline">Try the demo</Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/hero.svg" alt="News cards dropping into an envelope" width={480} height={360} />
      </section>
      <section className="steps">
        <div className="card step">
          <span className="step-num">1</span>
          <h3><Sparkles size={18} aria-hidden /> Pick your topics</h3>
          <p>Nigeria, World, Business, Technology, Sports and more.</p>
        </div>
        <div className="card step">
          <span className="step-num">2</span>
          <h3><Clock size={18} aria-hidden /> Choose your times</h3>
          <p>A morning briefing, an evening briefing, or both, in your time zone.</p>
        </div>
        <div className="card step">
          <span className="step-num">3</span>
          <h3><Mail size={18} aria-hidden /> Read in two minutes</h3>
          <p>AI summaries of each story, with a link to the full article at the source.</p>
        </div>
      </section>
    </main>
  );
}
