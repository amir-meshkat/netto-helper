import { t } from "../i18n";
import { byId, escapeHtml } from "./dom";

interface PageOptions {
  /** Page title for the browser tab. Leave out on the landing page. */
  title?: string;
  /** Relative link back to the landing page, for example "../index.html". Leave out on the landing page. */
  homeHref?: string;
  /** Extra notes shown above the standard footer text, as [title, text] pairs. */
  notes?: [string, string][];
}

/** Sets language and direction, and fills the shared header and footer. */
export function initPage({ title, homeHref, notes = [] }: PageOptions = {}): void {
  document.documentElement.lang = t.meta.lang;
  document.documentElement.dir = t.meta.dir;
  document.title = title ? `${title} | ${t.meta.siteName}` : t.meta.siteName;

  const home = homeHref ?? "./index.html";
  byId("site-header").innerHTML = `
    <a class="brand" href="${home}"><span class="brand-mark" aria-hidden="true">€</span>${escapeHtml(t.meta.siteName)}</a>
    ${homeHref ? `<a class="home-link" href="${homeHref}">${escapeHtml(t.common.homeLink)}</a>` : ""}`;

  const noteParagraphs = notes
    .map(([noteTitle, text]) => `<p><strong>${escapeHtml(noteTitle)}.</strong> ${escapeHtml(text)}</p>`)
    .join("");
  byId("site-footer").innerHTML = `
    ${noteParagraphs}
    <p><strong>${escapeHtml(t.common.notIncludedTitle)}.</strong> ${escapeHtml(t.common.notIncluded)}</p>
    <p>${escapeHtml(t.common.privacy)}</p>
    <p>${escapeHtml(t.common.disclaimer)}</p>`;
}
