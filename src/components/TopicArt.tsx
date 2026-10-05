import { getTopic } from "@/lib/topics";

/** Custom SVG thumbnail per topic. No external images are loaded. */
export function TopicArt({ topic, seed = 0, label }: { topic: string; seed?: number; label?: string }) {
  const color = getTopic(topic)?.color ?? "#1a73e8";
  const shift = (seed * 37) % 40;
  const motif = MOTIFS[topic] ?? MOTIFS.world;
  return (
    <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label ?? `${getTopic(topic)?.label ?? "News"} illustration`}>
      <rect width="160" height="160" fill={color} opacity="0.14" />
      <circle cx={130 - shift} cy={30 + shift / 2} r="46" fill={color} opacity="0.18" />
      <circle cx={20 + shift} cy={140} r="38" fill={color} opacity="0.12" />
      <g transform="translate(40 40)" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {motif}
      </g>
    </svg>
  );
}

const MOTIFS: Record<string, React.ReactNode> = {
  world: (
    <>
      <circle cx="40" cy="40" r="36" />
      <path d="M4 40h72M40 4c14 14 14 58 0 72M40 4c-14 14-14 58 0 72" />
    </>
  ),
  nigeria: (
    <>
      <path d="M40 76s-28-26-28-44a28 28 0 0 1 56 0c0 18-28 44-28 44z" />
      <circle cx="40" cy="32" r="10" />
    </>
  ),
  africa: (
    <path d="M26 6l22 4 10 14 16 6-6 16-12 10-4 18-12 4-6-18-14-12-8-14 6-16z" />
  ),
  business: (
    <>
      <path d="M8 72h64" />
      <path d="M16 60V44M32 60V30M48 60V38M64 60V14" />
      <path d="M12 30l18-14 14 8 24-18" />
    </>
  ),
  technology: (
    <>
      <rect x="16" y="16" width="48" height="48" rx="8" />
      <rect x="30" y="30" width="20" height="20" rx="3" />
      <path d="M28 4v12M52 4v12M28 64v12M52 64v12M4 28h12M4 52h12M64 28h12M64 52h12" />
    </>
  ),
  science: (
    <>
      <path d="M28 4h24M32 4v24L10 68a6 6 0 0 0 5 8h50a6 6 0 0 0 5-8L48 28V4" />
      <path d="M20 52h40" />
    </>
  ),
  health: (
    <>
      <path d="M40 72S6 52 6 28A17 17 0 0 1 40 18a17 17 0 0 1 34 10c0 24-34 44-34 44z" />
      <path d="M14 40h14l6-10 8 20 6-10h18" />
    </>
  ),
  sports: (
    <>
      <path d="M22 6h36v22a18 18 0 0 1-36 0z" />
      <path d="M22 14H8c0 14 6 20 14 20M58 14h14c0 14-6 20-14 20M40 46v14M26 74h28M30 60h20v14H30z" />
    </>
  ),
  entertainment: (
    <>
      <rect x="6" y="28" width="68" height="46" rx="5" />
      <path d="M6 28l8-22 64 10-4 12M24 8l8 20M44 11l8 18" />
    </>
  ),
};
