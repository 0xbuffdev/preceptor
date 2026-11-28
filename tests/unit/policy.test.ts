import { describe, expect, it } from "vitest";
import {
  type Capability,
  type HostPolicy,
  type InstructionIntent,
  type InstructionMode,
  type InstructionPlan,
  planInstruction,
  POLICY_REVISION,
  type TeachingStrategy,
} from "../../src/index";

const capabilities: readonly Capability[] = [
  "lesson.read",
  "memory.recall",
  "memory.remember",
  "memory.forget",
  "practice.suggest",
];
const intents: readonly InstructionIntent[] = [
  "explain", "question", "hint", "practice", "reflect", "retrieve", "prepare", "process",
];
const vectors: readonly {
  mode: InstructionMode;
  default: TeachingStrategy;
  allowed: readonly InstructionIntent[];
  ceiling: readonly Capability[];
}[] = [
  { mode: "guided_learning", default: "explain", allowed: ["explain", "question", "hint", "practice", "reflect"], ceiling: capabilities },
  { mode: "ungraded_practice", default: "practice", allowed: ["question", "hint", "practice", "reflect"], ceiling: capabilities },
  { mode: "retrieval_coaching", default: "retrieve", allowed: ["retrieve", "question", "reflect", "practice"], ceiling: capabilities },
  { mode: "defense_preparation", default: "question", allowed: ["question", "reflect", "hint"], ceiling: ["lesson.read", "memory.recall", "practice.suggest"] },
  { mode: "assessment_locked", default: "pause", allowed: [], ceiling: [] },
];

function host(mode: InstructionMode = "guided_learning"): HostPolicy {
  return {
    policyRevision: POLICY_REVISION,
    sessionId: "synthetic-session",
    mode,
    grants: capabilities,
    consent: capabilities,
    installed: capabilities,
    lesson: { documentRef: "example", revision: "1", visibility: "public" },
  };
}

function completed(policy: unknown, request: unknown = { assistance: "plan" }): InstructionPlan {
  const result = planInstruction(policy, request);
  if (result.status !== "completed") throw new Error("Expected completed plan");
  return result;
}

function subset(mask: number): Capability[] {
  return capabilities.filter((_, index) => (mask & (1 << index)) !== 0);
}

describe("instructional policy", () => {
  for (const vector of vectors) {
    it(`selects each intent and default for ${vector.mode}`, () => {
      expect(completed(host(vector.mode)).strategy).toBe(vector.default);
      for (const intent of intents) {
        const result = completed(host(vector.mode), { assistance: "plan", intent });
        const allowed = vector.allowed.includes(intent);
        expect(result.strategy).toBe(allowed ? intent : vector.default);
        expect(result.reason).toBe(
          vector.mode === "assessment_locked" ? "assessment_locked" : allowed ? "requested_intent" : "unsupported_intent",
        );
        expect(result.nextActions[0]?.text.length).toBeGreaterThan(0);
      }
    });

    it(`intersects all capability subsets for ${vector.mode}`, () => {
      for (let grant = 0; grant < 32; grant++) {
        for (let consent = 0; consent < 32; consent++) {
          for (let installed = 0; installed < 32; installed++) {
            const policy = { ...host(vector.mode), grants: subset(grant).reverse(), consent: subset(consent), installed: subset(installed) };
            const result = completed(policy);
            const expected = capabilities.filter((capability, index) =>
              vector.ceiling.includes(capability) && ((grant & consent & installed) & (1 << index)) !== 0,
            );
            if (result.capabilities.join() !== expected.join()) throw new Error("Capability intersection mismatch");
            if (result.denials.length !== capabilities.length - expected.length) throw new Error("Denial count mismatch");
          }
        }
      }
    });
  }

  it("reports missing capability reasons without substituting permissions", () => {
    const result = completed({ ...host(), grants: ["lesson.read", "memory.recall", "memory.remember"], consent: ["lesson.read", "memory.remember"], installed: ["lesson.read"] });
    expect(result.capabilities).toEqual(["lesson.read"]);
    expect(result.denials).toEqual([
      { capability: "memory.recall", reason: "no_consent" },
      { capability: "memory.remember", reason: "not_installed" },
      { capability: "memory.forget", reason: "not_granted" },
      { capability: "practice.suggest", reason: "not_granted" },
    ]);
  });

  it("requires a lesson reference and public criteria for defense", () => {
    const { lesson: _, ...withoutLesson } = host();
    expect(completed(withoutLesson).denials).toContainEqual({ capability: "lesson.read", reason: "lesson_unavailable" });
    expect(completed({ ...host("defense_preparation"), lesson: { documentRef: "private", revision: "1", visibility: "restricted" } }).denials).toContainEqual({ capability: "lesson.read", reason: "public_criteria_required" });
  });

  it("is deterministic, detached from the input and insensitive to capability ordering", () => {
    const policy = host();
    const request = { assistance: "plan", intent: "hint" };
    const before = completed(policy, request);
    expect(completed(policy, request)).toEqual(before);
    expect(completed({ ...policy, grants: [...capabilities].reverse() }, request)).toEqual(before);
    expect(before.policyRevision).toBe(POLICY_REVISION);
    expect(JSON.stringify(before)).not.toContain(policy.sessionId);
  });

  it("uses only fixed non-credit prompts and explicitly lacks generation", () => {
    expect(planInstruction(host(), { assistance: "generate" })).toEqual({
      status: "unavailable", policyRevision: POLICY_REVISION, reason: "model_unavailable",
    });
    expect(completed({ ...host(), signals: { difficulty: "high" } }).nextActions).not.toEqual(completed(host()).nextActions);
    expect(completed(host()).nextActions[0]?.kind).toBe("fixed_prompt");
  });
});
