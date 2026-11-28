import { describe, expect, it, vi } from "vitest";
import { POLICY_REVISION, planInstruction } from "../../src/index";

const policy = {
  policyRevision: POLICY_REVISION,
  sessionId: "SYNTHETIC_PRIVATE_CANARY",
  mode: "assessment_locked",
  grants: [],
  consent: [],
  installed: [],
};
const request = { assistance: "plan" };

describe("untrusted policy inputs", () => {
  it("rejects unknown authority, unsupported revisions and malformed fields", () => {
    for (const value of [
      null,
      [],
      { ...policy, policyRevision: "unknown" },
      { ...policy, mode: "admin" },
      { ...policy, grant: ["grade.write"] },
      { ...policy, grants: ["grade.write"] },
      { ...policy, consent: ["*"] },
      { ...policy, installed: ["memory.recall", "memory.recall"] },
      { ...policy, grants: ["memory.recall", "memory.recall"] },
      { ...policy, consent: ["memory.recall", "memory.recall"] },
      { ...policy, grants: new Array(5) },
      { ...policy, grants: new Array(6).fill("lesson.read") },
      { ...policy, sessionId: "" },
      { ...policy, sessionId: "é".repeat(129) },
      { ...policy, lesson: { documentRef: "a", revision: "" } },
      {
        ...policy,
        lesson: { documentRef: "a", revision: "1", visibility: "public", owner: "other" },
      },
      { ...policy, signals: { mastery: true } },
      { ...policy, signals: { difficulty: 10 } },
      { ...policy, grants: undefined },
      { ...policy, lesson: undefined },
      Object.create(policy),
      { ...policy, [Symbol("hidden")]: true },
    ]) {
      expect(planInstruction(value, request)).toEqual({
        status: "invalid_input",
        reason: "invalid_host_policy",
      });
    }
    for (const value of [
      { ...request, mode: "guided_learning" },
      { ...request, grants: ["lesson.read"] },
      { ...request, intent: "grade.write" },
      { ...request, assistance: "unknown" },
      { ...request, intent: undefined },
      {},
      null,
    ]) {
      expect(planInstruction(policy, value)).toEqual({
        status: "invalid_input",
        reason: "invalid_request",
      });
    }
  });

  it("does not execute accessors in records or capability arrays", () => {
    const getter = vi.fn(() => "guided_learning");
    expect(
      planInstruction(
        {
          ...policy,
          get mode() {
            return getter();
          },
        },
        request,
      ).status,
    ).toBe("invalid_input");
    const array = ["lesson.read"];
    Object.defineProperty(array, "0", { get: getter, enumerable: true });
    expect(planInstruction({ ...policy, grants: array }, request).status).toBe("invalid_input");
    expect(getter).not.toHaveBeenCalled();
  });

  it("returns identical public process guidance for locked requests without I/O", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Unexpected network access");
    });
    const clock = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Unexpected clock access");
    });
    const random = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Unexpected randomness");
    });
    let first: ReturnType<typeof planInstruction>;
    let second: ReturnType<typeof planInstruction>;
    try {
      first = planInstruction(policy, request);
      second = planInstruction(policy, { assistance: "generate", intent: "explain" });
    } finally {
      fetchSpy.mockRestore();
      clock.mockRestore();
      random.mockRestore();
    }
    expect(first).toEqual(second);
    expect(first).toMatchObject({ status: "completed", strategy: "pause", capabilities: [] });
    expect(JSON.stringify(first)).not.toContain("SYNTHETIC_PRIVATE_CANARY");
  });
});
