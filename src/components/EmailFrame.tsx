"use client";

import { useRef } from "react";

/** Shows stored email HTML. Scripts stay blocked; the frame grows to fit the email. */
export function EmailFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const fit = () => {
    const doc = ref.current?.contentDocument;
    if (ref.current && doc) ref.current.style.height = `${doc.documentElement.scrollHeight + 8}px`;
  };
  return (
    <iframe
      ref={ref}
      className="mail-frame"
      title={title}
      srcDoc={html}
      onLoad={fit}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      data-testid="email-frame"
    />
  );
}
