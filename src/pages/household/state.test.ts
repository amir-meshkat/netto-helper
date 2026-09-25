import { describe, expect, it } from "vitest";
import { newJob } from "../../ui/job-input";
import { newSide } from "../../ui/side-input";
import { defaultState, loadState, parseSavedState } from "./state";

describe("parseSavedState", () => {
  it("restores a valid saved state, with or without side income", () => {
    const saved = {
      version: 2,
      people: [
        { name: "", job: newJob("3000"), side: newSide("12000", "2000") },
        { name: "Sara", job: newJob("2800"), side: null },
      ],
    };
    expect(parseSavedState(JSON.stringify(saved))).toEqual(saved);
  });

  it("returns null for missing, broken, old or unexpected data", () => {
    expect(parseSavedState(null)).toBeNull();
    expect(parseSavedState("{not json")).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 1, people: [{ name: "", jobs: [newJob("3000")] }] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 2, people: [] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 2, people: [{ name: "", job: newJob("1"), side: 5 }] }))).toBeNull();
  });
});

describe("loadState", () => {
  it("falls back to the example when storage is not available (as in these tests)", () => {
    expect(loadState()).toEqual(defaultState());
  });
});
