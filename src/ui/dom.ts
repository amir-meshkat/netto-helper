/** Makes text safe to put inside HTML. Always use it for anything a user typed, such as names. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Puts a highlighted amount where a translated sentence has "{amount}". The rest is escaped. */
export function withAmount(sentence: string, amountHtml: string): string {
  return sentence
    .split("{amount}")
    .map((part) => escapeHtml(part))
    .join(amountHtml);
}

/**
 * Remembers which <details data-key="..."> are open, so they stay open when a page redraws.
 * Use ` open` from openIf() when rendering.
 */
export function rememberOpenDetails(): { openIf: (key: string) => string; isOpen: (key: string) => boolean } {
  const open = new Set<string>();
  // "toggle" does not bubble, so listen in the capture phase.
  document.addEventListener(
    "toggle",
    (event) => {
      const el = event.target;
      if (!(el instanceof HTMLDetailsElement) || !el.dataset.key) return;
      if (el.open) open.add(el.dataset.key);
      else open.delete(el.dataset.key);
    },
    true,
  );
  return { openIf: (key) => (open.has(key) ? " open" : ""), isOpen: (key) => open.has(key) };
}

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
