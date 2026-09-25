import { escapeHtml } from "./dom";
import { niceTicks } from "./ticks";

// A small hand-written SVG line chart: 2px lines, hairline grid, markers with a surface ring,
// direct labels, and a crosshair tooltip on hover and keyboard. Drawn at the container's real
// width (so text stays readable on phones) and redrawn when that width changes.

export interface ChartSeries {
  label: string;
  /** CSS colour, for example "var(--person-a)". */
  color: string;
  /** Sorted by x. All series share the same x values. */
  points: { x: number; y: number }[];
}

export interface ChartMarker {
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface LineChartSpec {
  series: ChartSeries[];
  markers: ChartMarker[];
  reference?: { y: number; label: string };
  xTitle: string;
  yTitle: string;
  xMax: number;
  yMax: number;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  /** Screen reader summary. A table view on the page carries the full data. */
  description: string;
  tooltipHead: (x: number) => string;
  tooltipValue: string;
}

interface Geometry {
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  width: number;
  xMax: number;
  yMax: number;
}

interface ChartState {
  spec: LineChartSpec;
  geometry?: Geometry;
  index: number | null;
}

const states = new WeakMap<HTMLElement, ChartState>();

export function renderLineChart(container: HTMLElement, spec: LineChartSpec): void {
  const existing = states.get(container);
  if (existing) {
    existing.spec = spec;
  } else {
    states.set(container, { spec, index: null });
    setUp(container);
  }
  draw(container);
}

function setUp(container: HTMLElement): void {
  container.classList.add("line-chart");
  container.tabIndex = 0;
  container.setAttribute("role", "group");

  let lastWidth = 0;
  new ResizeObserver(() => {
    if (container.clientWidth !== lastWidth) {
      lastWidth = container.clientWidth;
      draw(container);
    }
  }).observe(container);

  container.addEventListener("pointermove", (event) => {
    const state = states.get(container);
    const g = state?.geometry;
    if (!state || !g) return;
    const box = container.getBoundingClientRect();
    const x = ((event.clientX - box.left - g.left) / g.plotWidth) * g.xMax;
    showAt(container, nearestIndex(state.spec, x));
  });
  container.addEventListener("pointerleave", () => hide(container));
  container.addEventListener("blur", () => hide(container));
  container.addEventListener("focus", () => {
    const state = states.get(container);
    const first = state?.spec.markers[0];
    if (state && first) showAt(container, nearestIndex(state.spec, first.x));
  });
  container.addEventListener("keydown", (event) => {
    const state = states.get(container);
    const count = state?.spec.series[0]?.points.length ?? 0;
    if (!state || count === 0) return;
    const step = Math.max(1, Math.round(count / 40));
    const current = state.index ?? 0;
    const moves: Record<string, number> = {
      ArrowRight: current + step,
      ArrowLeft: current - step,
      Home: 0,
      End: count - 1,
    };
    if (event.key === "Escape") return hide(container);
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    showAt(container, Math.min(count - 1, Math.max(0, next)));
  });
}

function nearestIndex(spec: LineChartSpec, x: number): number {
  const points = spec.series[0]?.points ?? [];
  let best = 0;
  points.forEach((p, i) => {
    if (Math.abs(p.x - x) < Math.abs((points[best]?.x ?? 0) - x)) best = i;
  });
  return best;
}

function draw(container: HTMLElement): void {
  const state = states.get(container);
  if (!state) return;
  const { spec } = state;
  container.setAttribute("aria-label", spec.description);

  const width = Math.max(280, container.clientWidth);
  const height = Math.round(Math.min(340, Math.max(230, width * 0.56)));
  const top = 30;
  const bottom = 44;
  const left = 54;
  const right = 18;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xTicks = niceTicks(spec.xMax, width < 480 ? 4 : 6);
  const yTicks = niceTicks(spec.yMax, 4);
  const xMax = xTicks.at(-1) ?? 1;
  const yMax = yTicks.at(-1) ?? 1;
  const sx = (x: number) => left + (Math.min(x, xMax) / xMax) * plotWidth;
  const sy = (y: number) => top + plotHeight - (Math.max(0, y) / yMax) * plotHeight;
  state.geometry = { left, top, plotWidth, plotHeight, width, xMax, yMax };
  state.index = null;

  const grid = yTicks
    .map((y) => `<line x1="${left}" x2="${left + plotWidth}" y1="${sy(y)}" y2="${sy(y)}"/>`)
    .join("");
  const yLabels = yTicks
    .map((y) => `<text class="axis-text" x="${left - 8}" y="${sy(y) + 4}" text-anchor="end">${escapeHtml(spec.formatY(y))}</text>`)
    .join("");
  const xLabels = xTicks
    .map((x) => `<text class="axis-text" x="${sx(x)}" y="${top + plotHeight + 18}" text-anchor="middle">${escapeHtml(spec.formatX(x))}</text>`)
    .join("");

  const reference = spec.reference
    ? `<line class="ref-line" x1="${left}" x2="${left + plotWidth}" y1="${sy(spec.reference.y)}" y2="${sy(spec.reference.y)}"/>
       <text class="ref-text" x="${left + plotWidth}" y="${sy(spec.reference.y) - 6}" text-anchor="end">${escapeHtml(spec.reference.label)}</text>`
    : "";

  const curves = spec.series
    .map((s) => {
      const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");
      return `<path class="curve" d="${d}" style="stroke:${s.color}"/>`;
    })
    .join("");

  // Direct labels on the markers. When two labels would overlap, the second goes below its dot.
  const placed: { x: number; y: number }[] = [];
  const markers = spec.markers
    .map((m) => {
      const cx = sx(m.x);
      const cy = sy(m.y);
      const clash = placed.some((p) => Math.abs(p.x - cx) < 120 && Math.abs(p.y - (cy - 14)) < 18);
      const ly = clash ? cy + 24 : cy - 14;
      placed.push({ x: cx, y: ly });
      const anchor = cx < left + 60 ? "start" : cx > left + plotWidth - 60 ? "end" : "middle";
      return `<circle class="marker" cx="${cx}" cy="${cy}" r="5" style="fill:${m.color}"/>
        <text class="marker-label" x="${cx}" y="${ly}" text-anchor="${anchor}">${escapeHtml(m.label)}</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
      <text class="axis-title" x="0" y="14">${escapeHtml(spec.yTitle)}</text>
      <g class="grid">${grid}</g>
      ${yLabels}
      ${xLabels}
      <text class="axis-title" x="${left + plotWidth}" y="${height - 4}" text-anchor="end">${escapeHtml(spec.xTitle)}</text>
      ${reference}
      ${curves}
      <g class="crosshair-layer" visibility="hidden">
        <line class="crosshair" y1="${top}" y2="${top + plotHeight}"/>
        ${spec.series.map((s) => `<circle class="marker" r="4" style="fill:${s.color}"/>`).join("")}
      </g>
      ${markers}
    </svg>
    <div class="chart-tooltip" hidden></div>`;
}

function showAt(container: HTMLElement, index: number): void {
  const state = states.get(container);
  const g = state?.geometry;
  if (!state || !g) return;
  state.index = index;
  const { spec } = state;
  const x = spec.series[0]?.points[index]?.x ?? 0;
  const px = g.left + (Math.min(x, g.xMax) / g.xMax) * g.plotWidth;

  const layer = container.querySelector<SVGGElement>(".crosshair-layer");
  const line = layer?.querySelector("line");
  if (!layer || !line) return;
  layer.setAttribute("visibility", "visible");
  line.setAttribute("x1", String(px));
  line.setAttribute("x2", String(px));
  layer.querySelectorAll("circle").forEach((dot, i) => {
    const y = spec.series[i]?.points[index]?.y ?? 0;
    dot.setAttribute("cx", String(px));
    dot.setAttribute("cy", String(g.top + g.plotHeight - (Math.max(0, y) / g.yMax) * g.plotHeight));
  });

  // Built with textContent: labels can contain names typed by users.
  const tip = container.querySelector<HTMLDivElement>(".chart-tooltip");
  if (!tip) return;
  tip.replaceChildren();
  const head = document.createElement("div");
  head.className = "tip-head";
  head.textContent = spec.tooltipHead(x);
  tip.append(head);
  for (const s of spec.series) {
    const row = document.createElement("div");
    row.className = "tip-row";
    const key = document.createElement("span");
    key.className = "tip-key";
    key.style.background = s.color;
    const value = document.createElement("strong");
    value.textContent = spec.formatY(s.points[index]?.y ?? 0);
    const label = document.createElement("span");
    label.textContent = spec.series.length > 1 ? `${spec.tooltipValue} (${s.label})` : spec.tooltipValue;
    row.append(key, value, label);
    tip.append(row);
  }
  tip.hidden = false;
  const tipWidth = tip.offsetWidth;
  const leftPos = px + 14 + tipWidth > g.width ? px - 14 - tipWidth : px + 14;
  tip.style.insetInlineStart = `${Math.max(0, leftPos)}px`;
  tip.style.insetBlockStart = `${g.top}px`;
}

function hide(container: HTMLElement): void {
  const state = states.get(container);
  if (state) state.index = null;
  container.querySelector(".crosshair-layer")?.setAttribute("visibility", "hidden");
  const tip = container.querySelector<HTMLDivElement>(".chart-tooltip");
  if (tip) tip.hidden = true;
}
