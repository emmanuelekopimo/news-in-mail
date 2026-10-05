import { Inbox, LogOut, Search, Settings } from "lucide-react";
import Link from "next/link";
import type { User } from "@/db/schema";
import { avatarUri } from "@/lib/avatar";
import { signOutAction } from "@/app/actions";
import { TopicTabs } from "./TopicTabs";

export function AppHeader({ user, followed, unread, query = "" }: { user: User; followed: string[]; unread: number; query?: string }) {
  return (
    <header className="header">
      <div className="header-row">
        <Link href="/news" className="brand" aria-label="News in Mail home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span><b>News</b> in Mail</span>
        </Link>
        <form action="/search" className="search" role="search">
          <Search size={20} aria-hidden />
          <label htmlFor="q" className="sr-only">Search stories</label>
          <input id="q" name="q" type="search" placeholder="Search for topics, places and sources" defaultValue={query} />
        </form>
        <div className="header-actions">
          <Link href="/inbox" className="icon-btn" aria-label={`Inbox, ${unread} new`} title="Inbox">
            <Inbox size={22} />
            {unread > 0 ? <span className="badge-dot">{unread}</span> : null}
          </Link>
          <Link href="/settings" className="icon-btn" aria-label="Settings" title="Settings">
            <Settings size={22} />
          </Link>
          <details className="menu">
            <summary aria-label="Account menu">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={avatarUri(user.email)} alt="" width={32} height={32} />
            </summary>
            <div className="menu-panel">
              <div className="who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avatar" src={avatarUri(user.email)} alt="" width={40} height={40} style={{ width: 40, height: 40 }} />
                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
              </div>
              <Link className="menu-link" href="/settings"><Settings size={18} /> Settings</Link>
              <form action={signOutAction}>
                <button className="menu-link" type="submit"><LogOut size={18} /> Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </div>
      <TopicTabs followed={followed} />
    </header>
  );
}
