import { describe, expect, it } from "vitest";
import * as preceptor from "../../src/index";

describe("public entry point", () => {
  it("exports only the approved runtime surface", () => {
    expect(Object.keys(preceptor).sort()).toEqual(["POLICY_REVISION", "planInstruction"]);
  });
});
