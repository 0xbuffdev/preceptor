import { type HostPolicy, type InstructionRequest, POLICY_REVISION, type PlanningResult } from "../contracts/policy";
import { fixedPrompt, selectStrategy } from "../strategy/select";
import { validateHostPolicy, validateRequest } from "../validation/policy";
import { effectiveCapabilities } from "./capabilities";

/**
 * Plans from host-bound data. This validates structure, not authentication.
 * Neither the host policy nor the learner request is executed as code.
 */
export function planInstruction(host: unknown, request: unknown): PlanningResult {
  let policy: HostPolicy | undefined;
  try {
    policy = validateHostPolicy(host);
  } catch {
    return { status: "invalid_input", reason: "invalid_host_policy" };
  }
  if (!policy) return { status: "invalid_input", reason: "invalid_host_policy" };

  let instruction: InstructionRequest | undefined;
  try {
    instruction = validateRequest(request);
  } catch {
    return { status: "invalid_input", reason: "invalid_request" };
  }
  if (!instruction) return { status: "invalid_input", reason: "invalid_request" };

  if (policy.mode !== "assessment_locked" && instruction.assistance === "generate") {
    return { status: "unavailable", policyRevision: POLICY_REVISION, reason: "model_unavailable" };
  }
  const selection = selectStrategy(policy.mode, instruction.intent);
  return {
    status: "completed",
    policyRevision: POLICY_REVISION,
    mode: policy.mode,
    ...selection,
    ...effectiveCapabilities(policy),
    nextActions: [{ kind: "fixed_prompt", text: fixedPrompt(selection.strategy, policy) }],
  };
}
