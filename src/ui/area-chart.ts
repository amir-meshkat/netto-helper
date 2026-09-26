import { frame, hideCrosshair, interactive, nearest, showTooltip, type Axes, type Frame, type TipRow } from "./chart-frame";
import { escapeHtml } from "./dom";

// A hand-written SVG stacked area chart: layers stacked from the bottom, a 2px gap in the surface
// colour between them, a "you are here" dot, short ticks along the top for single points, and a
// crosshair tooltip on hover and keyboard.

export interface AreaLayer {
  label: string;
  /** CSS colour, for example "var(--netto)". */
  color: string;
  /** Fill opacity. The layer the chart is about is the strongest. */
  opacity: number;
  /** One value per x, stacked on the layers below. Below zero counts as zero. */
  values: number[];
}

export interface AreaMarker {
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface AreaChartSpec extends Axes {
  /** Sorted from low to high. */
  xs: number[];
  /** Bottom layer first. */
  layers: AreaLayer[];
  markers: AreaMarker[];
  /** Short ticks along the top of the plot, for single points such as a toeslag that drops at once. */
  ticks: { x: number; color: string }[];
  /** Screen reader summary. A table view on the page carries the full data. */
  description: string;
  tooltip: (index: number) => { head: string; rows: TipRow[]; notes: string[] };
}

interface ChartState {
  width: number;
  spec: AreaChartSpec;
  frame?: Frame;
}

const states = new WeakMap<HTMLElement, ChartState>();

export function renderAreaChart(container: HTMLElement, spec: AreaChartSpec): void {
  const existing = states.get(container);
  if (existing) {
    existing.spec = spec;
  } else {
    const state: ChartState = { spec, width: 0 };
    states.set(container, state);
    state.width = interactive(container, {
      count: () => state.spec.xs.length,
      indexAt: (x) => nearest(state.spec.xs, x),
      start: () => nearest(state.spec.xs, state.spec.markers[0]?.x ?? 0),
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

/** The top of every layer at every x: layer i sits on layers 0 to i-1. */
function stack(spec: AreaChartSpec): number[][] {
  const tops: number[][] = [];
  spec.layers.forEach((layer, i) => {
    tops.push(spec.xs.map((_, k) => (tops[i - 1]?.[k] ?? 0) + Math.max(0, layer.values[k] ?? 0)));
  });
  return tops;
}

function draw(container: HTMLElement): void {
  const state = states.get(container);
  if (!state) return;
  const { spec } = state;
  container.setAttribute("aria-label", spec.description);
  const f = frame(state.width, spec);
  state.frame = f;
  const { left, top, plotWidth, plotHeight, sx, sy } = f;
  const tops = stack(spec);

  /** "L x,y" for every point along one boundary. */
  const line = (ys: number[]) => spec.xs.map((x, k) => `L${sx(x).toFixed(1)},${sy(ys[k] ?? 0).toFixed(1)}`).join("");
  const areas = spec.layers
    .map((layer, i) => {
      const upper = tops[i] ?? [];
      const lower = tops[i - 1] ?? spec.xs.map(() => 0);
      const back = [...spec.xs].reverse().map((x, j) => `L${sx(x).toFixed(1)},${sy(lower[spec.xs.length - 1 - j] ?? 0).toFixed(1)}`).join("");
      const d = `M${sx(spec.xs[0] ?? 0).toFixed(1)},${sy(lower[0] ?? 0).toFixed(1)}${line(upper)}${back}Z`;
      return `<path class="area" d="${d}" style="fill:${layer.color};fill-opacity:${layer.opacity}"/>`;
    })
    .join("");
  // A 2px gap in the surface colour between layers, so they stay apart without borders.
  const gaps = tops
    .slice(0, -1)
    .map((ys) => `<path class="area-gap" d="M${line(ys).slice(1)}"/>`)
    .join("");

  const ticks = spec.ticks
    .filter((t) => t.x > 0 && t.x < f.xMax)
    .map((t) => `<line class="area-tick" x1="${sx(t.x)}" x2="${sx(t.x)}" y1="${top - 9}" y2="${top - 2}" style="stroke:${t.color}"/>`)
    .join("");

  const markers = spec.markers
    .map((m) => {
      const cx = sx(m.x);
      const cy = sy(m.y);
      // Above the dot, unless that runs into the ticks along the top.
      const ly = cy - 14 < top + 12 ? cy + 24 : cy - 14;
      const anchor = cx < left + 60 ? "start" : cx > left + plotWidth - 60 ? "end" : "middle";
      return `<circle class="marker" cx="${cx}" cy="${cy}" r="6" style="fill:${m.color}"/>
        <text class="marker-label" x="${cx}" y="${ly}" text-anchor="${anchor}">${escapeHtml(m.label)}</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg width="${f.width}" height="${f.height}" viewBox="0 0 ${f.width} ${f.height}" aria-hidden="true" focusable="false">
      ${areas}
      ${gaps}
      ${f.svg}
      ${ticks}
      <g class="crosshair-layer" visibility="hidden">
        <line class="crosshair" y1="${top}" y2="${top + plotHeight}"/>
        ${spec.layers
          .slice(0, -1)
          .map((layer) => `<circle class="marker" r="4" style="fill:${layer.color}"/>`)
          .join("")}
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
  const px = f.sx(spec.xs[index] ?? 0);
  const tops = stack(spec);

  const layer = container.querySelector<SVGGElement>(".crosshair-layer");
  const line = layer?.querySelector("line");
  if (!layer || !line) return;
  layer.setAttribute("visibility", "visible");
  line.setAttribute("x1", String(px));
  line.setAttribute("x2", String(px));
  layer.querySelectorAll("circle").forEach((dot, i) => {
    dot.setAttribute("cx", String(px));
    dot.setAttribute("cy", String(f.sy(tops[i]?.[index] ?? 0)));
  });

  const tip = spec.tooltip(index);
  showTooltip(container, f, px, tip.head, tip.rows, tip.notes);
}
