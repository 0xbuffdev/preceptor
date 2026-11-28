import {
  type HostPolicy,
  type InstructionRequest,
  POLICY_REVISION,
  planInstruction,
} from "@0xbuff/preceptor";

const host: HostPolicy = {
  policyRevision: POLICY_REVISION,
  sessionId: "typed-consumer",
  mode: "retrieval_coaching",
  grants: [],
  consent: [],
  installed: [],
};
const request: InstructionRequest = { assistance: "plan" };
const result = planInstruction(host, request);
if (result.status === "completed") {
  const strategy: string = result.strategy;
  const prompt: string | undefined = result.nextActions[0]?.text;
  console.log(strategy, prompt);
}
