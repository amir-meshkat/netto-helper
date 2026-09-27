import { describe, expect, it } from "vitest";
import { newChild, newHome } from "../ui/home-input";
import { newJob } from "../ui/job-input";
import { newSide } from "../ui/side-input";
import { defaultState, fromOldSideIncomePage, loadState, parseSavedState } from "./state";

describe("parseSavedState", () => {
  const people = [
    { name: "", job: newJob("3000"), side: newSide("12000", "2000") },
    { name: "Sara", job: newJob("2800"), side: null },
  ];

  it("restores a valid saved state, with or without side income and toeslagen inputs", () => {
    const saved = { version: 3, people, home: { ...newHome(), rent: "850", children: [newChild()] } };
    expect(parseSavedState(JSON.stringify(saved))).toEqual(saved);
  });

  it("keeps the lijfrente what-if and each person's factor A", () => {
    const saved = { version: 3, people: [{ ...people[0], factorA: "1500", lastYear: "45000", reservering: "10000" }], home: newHome(), lijfrente: "2500" };
    expect(parseSavedState(JSON.stringify(saved))).toEqual(saved);
    expect(parseSavedState(JSON.stringify({ ...saved, people: [{ ...people[0], factorA: 3 }] }))).toBeNull();
  });

  it("keeps a mortgage, and reads a home saved before the mortgage as one without", () => {
    const withMortgage = { version: 3, people, home: { ...newHome(), mortgage: { woz: "400000", loan: "300000", rate: "4" } } };
    expect(parseSavedState(JSON.stringify(withMortgage))).toEqual(withMortgage);
    const { mortgage: _, ...before } = newHome();
    expect(parseSavedState(JSON.stringify({ version: 3, people, home: before }))).toEqual({ version: 3, people, home: newHome() });
    const broken = { version: 3, people, home: { ...newHome(), mortgage: { woz: 1 } } };
    expect(parseSavedState(JSON.stringify(broken))).toBeNull();
  });

  it("upgrades what was saved before the toeslagen (version 2): same people, an empty home", () => {
    expect(parseSavedState(JSON.stringify({ version: 2, people }))).toEqual({ version: 3, people, home: newHome() });
  });

  it("returns null for missing, broken, old or unexpected data", () => {
    expect(parseSavedState(null)).toBeNull();
    expect(parseSavedState("{not json")).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 1, people: [{ name: "", jobs: [newJob("3000")] }] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 2, people: [] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 2, people: [{ name: "", job: newJob("1"), side: 5 }] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ version: 3, people: [{ name: "", job: newJob("1"), side: null }], home: {} }))).toBeNull();
  });
});

describe("loadState", () => {
  it("falls back to the example when storage is not available (as in these tests)", () => {
    expect(loadState()).toEqual(defaultState());
  });
});

describe("fromOldSideIncomePage", () => {
  const old = {
    version: 1,
    partners: [
      { name: "", main: newJob("3800") },
      { name: "Sara", main: newJob("2000") },
    ],
    side: newSide("12000", "2000"),
  };

  it("turns the old side income page's partners into people, with the side income on the first", () => {
    expect(fromOldSideIncomePage(JSON.stringify(old))).toEqual({
      version: 3,
      people: [
        { name: "", job: newJob("3800"), side: newSide("12000", "2000") },
        { name: "Sara", job: newJob("2000"), side: null },
      ],
      home: newHome(),
    });
  });

  it("returns null when nothing valid was saved there", () => {
    expect(fromOldSideIncomePage(null)).toBeNull();
    expect(fromOldSideIncomePage("{not json")).toBeNull();
    expect(fromOldSideIncomePage(JSON.stringify({ ...old, partners: [] }))).toBeNull();
    expect(fromOldSideIncomePage(JSON.stringify({ ...old, side: { revenue: 5 } }))).toBeNull();
  });
});
