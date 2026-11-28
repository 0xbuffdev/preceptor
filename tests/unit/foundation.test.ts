import { describe, expect, it } from "vitest";
import * as preceptor from "../../src/index";

describe("foundation entry point", () => {
  it("exports no unimplemented operations", () => {
    expect(Object.keys(preceptor)).toEqual([]);
  });
});
