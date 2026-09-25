import { t, type Who } from "../i18n";

/** "You" for the first person and "Your partner" for the second, until a name is typed. */
export function makeWho(name: string, index: number): Who {
  const typed = name.trim();
  if (typed) return { name: typed, inSentence: typed, you: false };
  return index === 0
    ? { name: t.common.you, inSentence: t.common.youInSentence, you: true }
    : { name: t.common.partner, inSentence: t.common.partnerInSentence, you: false };
}
