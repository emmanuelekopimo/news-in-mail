import {
  Briefcase,
  Clapperboard,
  Cpu,
  FlaskConical,
  Globe,
  HeartPulse,
  Map,
  MapPin,
  Newspaper,
  Trophy,
  type LucideProps,
} from "lucide-react";
import { getTopic } from "@/lib/topics";

const ICONS = { Globe, MapPin, Map, Briefcase, Cpu, FlaskConical, HeartPulse, Trophy, Clapperboard };

export function TopicIcon({ topic, ...props }: { topic: string } & LucideProps) {
  const name = getTopic(topic)?.icon as keyof typeof ICONS | undefined;
  const Icon = (name && ICONS[name]) || Newspaper;
  return <Icon aria-hidden {...props} />;
}
