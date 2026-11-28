import { type HostPolicy, POLICY_REVISION, planInstruction } from "@0xbuff/preceptor";

const host: HostPolicy = {
  policyRevision: POLICY_REVISION,
  sessionId: "example",
  mode: "guided_learning",
  grants: [],
  consent: [],
  installed: [],
};

const result = planInstruction(host, { assistance: "plan", intent: "question" });
if (result.status === "completed") {
  console.log(result.nextActions[0]?.text);
}
