import assert from "node:assert/strict";
import * as preceptor from "@0xbuff/preceptor";

assert.deepEqual(Object.keys(preceptor).sort(), ["POLICY_REVISION", "planInstruction"]);
const host = {
  policyRevision: preceptor.POLICY_REVISION,
  sessionId: "offline-example",
  mode: "guided_learning",
  grants: [],
  consent: [],
  installed: [],
};
const plan = preceptor.planInstruction(host, { assistance: "plan", intent: "question" });
assert.equal(plan.status, "completed");
assert.equal(plan.strategy, "question");
assert.ok(plan.nextActions[0].text.length > 0);
assert.deepEqual(plan.capabilities, []);
assert.deepEqual(preceptor.planInstruction(host, { assistance: "generate" }), {
  status: "unavailable",
  policyRevision: preceptor.POLICY_REVISION,
  reason: "model_unavailable",
});
await assert.rejects(import("@0xbuff/preceptor/dist/index.js"), {
  code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});
