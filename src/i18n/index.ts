import { en, type Messages } from "./en";

export type { Messages, Who } from "./en";

// Only English for now. When nl.ts and fa.ts exist, pick one here (saved choice or browser language).
export const t: Messages = en;
