import type { Capability, CapabilityDenial, HostPolicy } from "../contracts/policy";
import { CAPABILITIES } from "../contracts/vocabulary";

function denial(
  policy: HostPolicy,
  capability: Capability,
): CapabilityDenial["reason"] | undefined {
  if (
    policy.mode === "assessment_locked" ||
    (policy.mode === "defense_preparation" &&
      (capability === "memory.remember" || capability === "memory.forget"))
  ) {
    return "mode_ceiling";
  }
  if (!policy.grants.includes(capability)) return "not_granted";
  if (!policy.consent.includes(capability)) return "no_consent";
  if (!policy.installed.includes(capability)) return "not_installed";
  if (capability === "lesson.read") {
    if (!policy.lesson) return "lesson_unavailable";
    if (policy.mode === "defense_preparation" && policy.lesson.visibility !== "public") {
      return "public_criteria_required";
    }
  }
}

export function effectiveCapabilities(policy: HostPolicy): {
  capabilities: Capability[];
  denials: CapabilityDenial[];
} {
  const capabilities: Capability[] = [];
  const denials: CapabilityDenial[] = [];
  for (const capability of CAPABILITIES) {
    const reason = denial(policy, capability);
    if (reason) denials.push({ capability, reason });
    else capabilities.push(capability);
  }
  return { capabilities, denials };
}
