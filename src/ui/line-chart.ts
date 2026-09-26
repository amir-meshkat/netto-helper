import { frame, hideCrosshair, interactive, nearest, showTooltip, type Axes, type Frame } from "./chart-frame";
import { escapeHtml } from "./dom";

// A small hand-written SVG line chart: 2px lines, hairline grid, markers with a surface ring,
// direct labels, and a crosshair tooltip on hover and keyboard.

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

export interface LineChartSpec extends Axes {
  series: ChartSeries[];
  markers: ChartMarker[];
  reference?: { y: number; label: string };
  /** Screen reader summary. A table view on the page carries the full data. */
  description: string;
  tooltipHead: (x: number) => string;
  tooltipValue: string;
}

interface ChartState {
  width: number;
  spec: LineChartSpec;
  frame?: Frame;
}

const states = new WeakMap<HTMLElement, ChartState>();

export function renderLineChart(container: HTMLElement, spec: LineChartSpec): void {
  const existing = states.get(container);
  if (existing) {
    existing.spec = spec;
  } else {
    const state: ChartState = { spec, width: 0 };
    states.set(container, state);
    const xs = () => state.spec.series[0]?.points.map((p) => p.x) ?? [];
    state.width = interactive(container, {
      count: () => xs().length,
      indexAt: (x) => nearest(xs(), x),
      start: () => nearest(xs(), state.spec.markers[0]?.x ?? 0),
      frame: () => state.frame,
      show: (index) => showAt(container, index),
      hide: () => hideCrosshair(container),
      redraw: (width) => {
        state.width = width;
        draw(container);
      },
    });
  }
  draw(container);
}

function draw(container: HTMLElement): void {
  const state = states.get(container);
  if (!state) return;
  const { spec } = state;
  container.setAttribute("aria-label", spec.description);
  const f = frame(state.width, spec);
  state.frame = f;
  const { left, top, plotWidth, plotHeight, sx, sy } = f;

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
    <svg width="${f.width}" height="${f.height}" viewBox="0 0 ${f.width} ${f.height}" aria-hidden="true" focusable="false">
      ${f.svg}
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
  const f = state?.frame;
  if (!state || !f) return;
  const { spec } = state;
  const x = spec.series[0]?.points[index]?.x ?? 0;
  const px = f.sx(x);

  const layer = container.querySelector<SVGGElement>(".crosshair-layer");
  const line = layer?.querySelector("line");
  if (!layer || !line) return;
  layer.setAttribute("visibility", "visible");
  line.setAttribute("x1", String(px));
  line.setAttribute("x2", String(px));
  layer.querySelectorAll("circle").forEach((dot, i) => {
    dot.setAttribute("cx", String(px));
    dot.setAttribute("cy", String(f.sy(spec.series[i]?.points[index]?.y ?? 0)));
  });

  const rows = spec.series.map((s) => ({
    color: s.color,
    value: spec.formatY(s.points[index]?.y ?? 0),
    label: spec.series.length > 1 ? `${spec.tooltipValue} (${s.label})` : spec.tooltipValue,
  }));
  showTooltip(container, f, px, spec.tooltipHead(x), rows);
}
