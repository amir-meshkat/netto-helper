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

export interface OpenDetails {
  /** " open" when the <details> with this key was open, for use inside its tag. */
  openIf: (key: string) => string;
  isOpen: (key: string) => boolean;
}

/**
 * Remembers which <details data-key="..."> are open, so they stay open when a page redraws.
 * Use ` open` from openIf() when rendering.
 */
export function rememberOpenDetails(): OpenDetails {
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

/**
 * Runs `fn` at most once per animation frame, however often it is asked for.
 * Dragging a slider fires many input events; the page only needs to redraw once per frame.
 */
export function oncePerFrame(fn: () => void): () => void {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      fn();
    });
  };
}
