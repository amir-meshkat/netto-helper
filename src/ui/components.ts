import { escapeHtml } from "./dom";

export type Tone = "netto" | "tax" | "pension" | "toeslag";

export interface Part {
  tone: Tone;
  value: number;
}

/** A horizontal bar split into netto, tax and pension. */
export function stackedBar(parts: Part[], label: string): string {
  const total = parts.reduce((sum, p) => sum + Math.max(0, p.value), 0) || 1;
  const segments = parts
    .map((p) => `<span class="tone-${p.tone}" style="inline-size:${(Math.max(0, p.value) / total) * 100}%"></span>`)
    .join("");
  return `<div class="bar" role="img" aria-label="${escapeHtml(label)}">${segments}</div>`;
}

/** 100 squares, one per euro of every €100. Counts must add up to 100 (or 0 for an empty grid). */
export function waffle(counts: { tone: Tone; count: number }[], label: string): string {
  const squares: string[] = [];
  for (const { tone, count } of counts) {
    for (let i = 0; i < count; i++) squares.push(`<i class="tone-${tone}"></i>`);
  }
  while (squares.length < 100) squares.push("<i></i>");
  return `<div class="waffle" role="img" aria-label="${escapeHtml(label)}">${squares.join("")}</div>`;
}

/** Colour key, optionally with an amount per line. */
export function legend(items: { tone: Tone; amount?: string; label: string }[], inline = false): string {
  const rows = items
    .map((item) => {
      const amount = item.amount ? `<span class="amount">${escapeHtml(item.amount)}</span>` : "";
      return `<li><span class="swatch tone-${item.tone}"></span>${amount}<span>${escapeHtml(item.label)}</span></li>`;
    })
    .join("");
  return `<ul class="legend${inline ? " legend-inline" : ""}">${rows}</ul>`;
}
