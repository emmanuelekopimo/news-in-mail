"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOPICS } from "@/lib/topics";

export function TopicTabs({ followed }: { followed: string[] }) {
  const path = usePathname();
  const ordered = [...TOPICS].sort((a, b) => Number(followed.includes(b.id)) - Number(followed.includes(a.id)));
  const tabs = [
    { href: "/news", label: "Home" },
    { href: "/inbox", label: "Inbox" },
    ...ordered.map((t) => ({ href: `/topic/${t.id}`, label: t.label })),
  ];
  return (
    <nav className="tabs" aria-label="Sections">
      {tabs.map((t) => {
        const active = path === t.href || (t.href !== "/news" && path.startsWith(`${t.href}/`));
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
