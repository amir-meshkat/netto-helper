import { escapeHtml } from "./dom";
import { niceTicks } from "./ticks";

// What the line chart and the area chart share: a frame with a hairline grid and axis labels, drawn at
// the container's real width (so text stays readable on phones), and a crosshair with a tooltip that
// follows the pointer, touch and the arrow keys. The width comes from a ResizeObserver, not from reading
// it on every redraw: that read would make the browser lay out the whole page again while dragging.

export interface Axes {
  xTitle: string;
  yTitle: string;
  xMax: number;
  yMax: number;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
}

export interface Frame {
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  width: number;
  height: number;
  /** The axes rounded up to their last tick. */
  xMax: number;
  yMax: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** Grid, axis labels and axis titles. */
  svg: string;
}

/** Sizes the plot to the container's width and draws the axes, rounded up to nice ticks. */
export function frame(containerWidth: number, axes: Axes): Frame {
  const width = Math.max(280, containerWidth);
  const height = Math.round(Math.min(340, Math.max(230, width * 0.56)));
  const top = 30;
  const left = 54;
  const plotWidth = width - left - 18;
  const plotHeight = height - top - 44;
  const xTicks = niceTicks(axes.xMax, width < 480 ? 4 : 6);
  const yTicks = niceTicks(axes.yMax, 4);
  const xMax = xTicks.at(-1) ?? 1;
  const yMax = yTicks.at(-1) ?? 1;
  const sx = (x: number) => left + (Math.min(x, xMax) / xMax) * plotWidth;
  const sy = (y: number) => top + plotHeight - (Math.min(Math.max(0, y), yMax) / yMax) * plotHeight;

  const grid = yTicks.map((y) => `<line x1="${left}" x2="${left + plotWidth}" y1="${sy(y)}" y2="${sy(y)}"/>`).join("");
  const yLabels = yTicks
    .map((y) => `<text class="axis-text" x="${left - 8}" y="${sy(y) + 4}" text-anchor="end">${escapeHtml(axes.formatY(y))}</text>`)
    .join("");
  const xLabels = xTicks
    .map((x) => `<text class="axis-text" x="${sx(x)}" y="${top + plotHeight + 18}" text-anchor="middle">${escapeHtml(axes.formatX(x))}</text>`)
    .join("");
  const svg = `
    <text class="axis-title" x="0" y="14">${escapeHtml(axes.yTitle)}</text>
    <g class="grid">${grid}</g>
    ${yLabels}
    ${xLabels}
    <text class="axis-title" x="${left + plotWidth}" y="${height - 4}" text-anchor="end">${escapeHtml(axes.xTitle)}</text>`;
  return { left, top, plotWidth, plotHeight, width, height, xMax, yMax, sx, sy, svg };
}

/** One line in a tooltip: a colour key (optional), a value and what it is. */
export interface TipRow {
  color?: string;
  value: string;
  label: string;
}

/** Fills the chart's tooltip and places it beside the crosshair at `px`. Built with textContent: labels can hold typed names. */
export function showTooltip(container: HTMLElement, f: Frame, px: number, head: string, rows: TipRow[], notes: string[] = []): void {
  const tip = container.querySelector<HTMLDivElement>(".chart-tooltip");
  if (!tip) return;
  tip.replaceChildren();
  const headEl = document.createElement("div");
  headEl.className = "tip-head";
  headEl.textContent = head;
  tip.append(headEl);
  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "tip-row";
    const key = document.createElement("span");
    key.className = "tip-key";
    if (r.color) key.style.background = r.color;
    const value = document.createElement("strong");
    value.textContent = r.value;
    const label = document.createElement("span");
    label.textContent = r.label;
    row.append(key, value, label);
    tip.append(row);
  }
  for (const note of notes) {
    const line = document.createElement("div");
    line.className = "tip-note";
    line.textContent = note;
    tip.append(line);
  }
  tip.hidden = false;
  const tipWidth = tip.offsetWidth;
  const leftPos = px + 14 + tipWidth > f.width ? px - 14 - tipWidth : px + 14;
  tip.style.insetInlineStart = `${Math.max(0, leftPos)}px`;
  tip.style.insetBlockStart = `${f.top}px`;
}

export interface Crosshair {
  /** How many x positions there are. */
  count: () => number;
  /** The position nearest to a value on the x axis. */
  indexAt: (x: number) => number;
  /** Where the crosshair starts when the chart gets keyboard focus, for example the "you are here" dot. */
  start: () => number;
  frame: () => Frame | undefined;
  show: (index: number) => void;
  hide: () => void;
  /** Draw again at a new width. */
  redraw: (width: number) => void;
}

/**
 * Makes a chart container focusable, redraws it when its width changes, and moves the crosshair with
 * pointer and keys. Returns the width now, read once.
 */
export function interactive(container: HTMLElement, c: Crosshair): number {
  container.classList.add("svg-chart");
  container.tabIndex = 0;
  container.setAttribute("role", "group");
  let index: number | null = null;
  const show = (i: number) => {
    index = Math.min(c.count() - 1, Math.max(0, i));
    c.show(index);
  };
  const hide = () => {
    index = null;
    c.hide();
  };

  let lastWidth = container.clientWidth;
  new ResizeObserver((entries) => {
    const width = Math.round(entries[0]?.contentRect.width ?? lastWidth);
    if (width !== lastWidth) {
      lastWidth = width;
      c.redraw(width);
    }
  }).observe(container);

  container.addEventListener("pointermove", (event) => {
    const f = c.frame();
    if (!f) return;
    const box = container.getBoundingClientRect();
    show(c.indexAt(((event.clientX - box.left - f.left) / f.plotWidth) * f.xMax));
  });
  container.addEventListener("pointerleave", hide);
  container.addEventListener("blur", hide);
  container.addEventListener("focus", () => show(c.start()));
  container.addEventListener("keydown", (event) => {
    const count = c.count();
    if (count === 0) return;
    if (event.key === "Escape") return hide();
    const step = Math.max(1, Math.round(count / 40));
    const current = index ?? c.start();
    const moves: Record<string, number> = { ArrowRight: current + step, ArrowLeft: current - step, Home: 0, End: count - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    show(next);
  });
  return lastWidth;
}

/** Hides the crosshair layer and the tooltip. */
export function hideCrosshair(container: HTMLElement): void {
  container.querySelector(".crosshair-layer")?.setAttribute("visibility", "hidden");
  const tip = container.querySelector<HTMLDivElement>(".chart-tooltip");
  if (tip) tip.hidden = true;
}

/** Index of the x value nearest to `x`, in a list sorted from low to high. */
export function nearest(xs: number[], x: number): number {
  let best = 0;
  xs.forEach((value, i) => {
    if (Math.abs(value - x) < Math.abs((xs[best] ?? 0) - x)) best = i;
  });
  return best;
}
