import { describe, expect, it } from "vitest";
import { niceTicks } from "./ticks";

describe("niceTicks", () => {
  it("covers the maximum with round steps", () => {
    expect(niceTicks(864)).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(niceTicks(8_000)).toEqual([0, 2000, 4000, 6000, 8000]);
    expect(niceTicks(10_400)).toEqual([0, 2500, 5000, 7500, 10000, 12500]);
  });

  it("handles small and zero maximums", () => {
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
