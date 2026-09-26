import { t } from "../i18n";
import { byId, escapeHtml } from "./dom";

interface PageOptions {
  /** Extra notes shown above the standard footer text, as [title, text] pairs. */
  notes?: [string, string][];
}

/** Sets language and direction, and fills the header and footer. */
export function initPage({ notes = [] }: PageOptions = {}): void {
  document.documentElement.lang = t.meta.lang;
  document.documentElement.dir = t.meta.dir;
  document.title = t.meta.siteName;

  byId("site-header").innerHTML = `
    <a class="brand" href="#top"><span class="brand-mark" aria-hidden="true">€</span>${escapeHtml(t.meta.siteName)}</a>`;

  const noteParagraphs = notes
    .map(([noteTitle, text]) => `<p><strong>${escapeHtml(noteTitle)}.</strong> ${escapeHtml(text)}</p>`)
    .join("");
  byId("site-footer").innerHTML = `
    ${noteParagraphs}
    <p><strong>${escapeHtml(t.common.notIncludedTitle)}.</strong> ${escapeHtml(t.common.notIncluded)}</p>
    <p>${escapeHtml(t.common.privacy)}</p>
    <p>${escapeHtml(t.common.disclaimer)}</p>`;
}
