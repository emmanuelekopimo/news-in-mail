export type TopicId =
  | "world"
  | "nigeria"
  | "africa"
  | "business"
  | "technology"
  | "science"
  | "health"
  | "sports"
  | "entertainment";

export type Feed = { url: string; source: string };

export type Topic = {
  id: TopicId;
  label: string;
  icon: string; // lucide icon name, mapped in the UI
  color: string;
  feeds: Feed[];
};

export const TOPICS: Topic[] = [
  {
    id: "world",
    label: "World",
    icon: "Globe",
    color: "#1a73e8",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC News" },
      { url: "https://www.theguardian.com/world/rss", source: "The Guardian" },
      { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" },
    ],
  },
  {
    id: "nigeria",
    label: "Nigeria",
    icon: "MapPin",
    color: "#188038",
    feeds: [
      { url: "https://www.premiumtimesng.com/feed", source: "Premium Times" },
      { url: "https://punchng.com/feed/", source: "Punch" },
      { url: "https://www.channelstv.com/feed/", source: "Channels TV" },
      { url: "https://www.vanguardngr.com/feed/", source: "Vanguard" },
    ],
  },
  {
    id: "africa",
    label: "Africa",
    icon: "Map",
    color: "#e37400",
    feeds: [{ url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", source: "BBC Africa" }],
  },
  {
    id: "business",
    label: "Business",
    icon: "Briefcase",
    color: "#a142f4",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC News" },
      { url: "https://www.theguardian.com/business/rss", source: "The Guardian" },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    icon: "Cpu",
    color: "#12b5cb",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC News" },
      { url: "https://www.theguardian.com/technology/rss", source: "The Guardian" },
      { url: "https://techcrunch.com/feed/", source: "TechCrunch" },
    ],
  },
  {
    id: "science",
    label: "Science",
    icon: "FlaskConical",
    color: "#d93025",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC News" },
      { url: "https://www.theguardian.com/science/rss", source: "The Guardian" },
    ],
  },
  {
    id: "health",
    label: "Health",
    icon: "HeartPulse",
    color: "#e52592",
    feeds: [{ url: "https://feeds.bbci.co.uk/news/health/rss.xml", source: "BBC News" }],
  },
  {
    id: "sports",
    label: "Sports",
    icon: "Trophy",
    color: "#f9ab00",
    feeds: [
      { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport" },
      { url: "https://www.theguardian.com/football/rss", source: "The Guardian" },
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "Clapperboard",
    color: "#5f6368",
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC News" },
    ],
  },
];

export const TOPIC_IDS = TOPICS.map((t) => t.id) as [TopicId, ...TopicId[]];

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as string[]).includes(value);
}

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
