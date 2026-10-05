import { createAvatar } from "@dicebear/core";
import { notionistsNeutral } from "@dicebear/collection";

/** Generates an avatar locally (no network) as a data URI. */
export function avatarUri(seed: string): string {
  return createAvatar(notionistsNeutral, {
    seed,
    backgroundColor: ["c2e7ff", "c4eed0", "ffdbcf", "fde293", "e8def8"],
    radius: 50,
  }).toDataUri();
}
