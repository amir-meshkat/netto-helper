import { describe, expect, it } from "vitest";
import { newJob } from "../../ui/job-input";
import { newSide } from "../../ui/side-input";
import type { HouseholdState } from "../household/state";
import { defaultState, fromHousehold, parseSavedState } from "./state";

describe("fromHousehold", () => {
  it("uses the example when nothing was typed on the household page", () => {
    expect(fromHousehold(null)).toEqual(defaultState());
  });

  it("takes both partners' names and salaries", () => {
    const household: HouseholdState = {
      version: 2,
      people: [
        { name: "", job: newJob("3000"), side: null },
        { name: "Sara", job: newJob("2800"), side: null },
      ],
    };
    const state = fromHousehold(household);
    expect(state.partners).toEqual([
      { name: "", main: newJob("3000") },
      { name: "Sara", main: newJob("2800") },
    ]);
    expect(state.side).toEqual(defaultState().side);
  });

  it("keeps a single person single, and uses their side income", () => {
    const household: HouseholdState = {
      version: 2,
      people: [{ name: "", job: newJob("3000"), side: newSide("20000", "1500") }],
    };
    const state = fromHousehold(household);
    expect(state.partners).toHaveLength(1);
    expect(state.side).toEqual(newSide("20000", "1500"));
  });

  it("copies, so editing here never changes the household page's data", () => {
    const household: HouseholdState = { version: 2, people: [{ name: "", job: newJob("3000"), side: null }] };
    const partner = fromHousehold(household).partners[0];
    if (partner) partner.main.monthly = "9999";
    expect(household.people[0]?.job.monthly).toBe("3000");
  });
});

describe("parseSavedState", () => {
  it("restores a valid state and rejects anything else", () => {
    const saved = defaultState();
    expect(parseSavedState(JSON.stringify(saved))).toEqual(saved);
    expect(parseSavedState(null)).toBeNull();
    expect(parseSavedState("[]")).toBeNull();
    expect(parseSavedState(JSON.stringify({ ...saved, partners: [] }))).toBeNull();
    expect(parseSavedState(JSON.stringify({ ...saved, side: { revenue: 5 } }))).toBeNull();
  });
});
