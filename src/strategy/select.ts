import type {
  HostPolicy,
  InstructionIntent,
  InstructionMode,
  InstructionPlan,
  TeachingStrategy,
} from "../contracts/policy";

const DEFAULTS: Readonly<Record<InstructionMode, TeachingStrategy>> = {
  guided_learning: "explain",
  ungraded_practice: "practice",
  retrieval_coaching: "retrieve",
  defense_preparation: "question",
  assessment_locked: "pause",
};

const ALLOWED: Readonly<Record<InstructionMode, readonly TeachingStrategy[]>> = {
  guided_learning: ["explain", "question", "hint", "practice", "reflect"],
  ungraded_practice: ["question", "hint", "practice", "reflect"],
  retrieval_coaching: ["retrieve", "question", "reflect", "practice"],
  defense_preparation: ["question", "reflect", "hint"],
  assessment_locked: [],
};

export function selectStrategy(
  mode: InstructionMode,
  intent: InstructionIntent | undefined,
): { strategy: TeachingStrategy; reason: InstructionPlan["reason"] } {
  if (mode === "assessment_locked") return { strategy: "pause", reason: "assessment_locked" };
  if (intent === undefined) return { strategy: DEFAULTS[mode], reason: "mode_default" };
  if (intent !== "prepare" && intent !== "process" && ALLOWED[mode].includes(intent)) {
    return { strategy: intent, reason: "requested_intent" };
  }
  return { strategy: DEFAULTS[mode], reason: "unsupported_intent" };
}

export function fixedPrompt(strategy: TeachingStrategy, policy: HostPolicy): string {
  if (strategy === "pause") {
    return "Follow the assessment's published instructions. Ask the host about permitted process steps.";
  }
  if (policy.mode === "defense_preparation") {
    if (strategy === "reflect")
      return "Reflect on how you would justify a design trade-off using the public criteria.";
    if (strategy === "hint")
      return "Choose a public criterion and identify which part of your approach addresses it.";
    return "Choose a public criterion and rehearse explaining your reasoning and a trade-off.";
  }
  switch (strategy) {
    case "explain":
      return policy.signals?.difficulty === "high"
        ? "Identify the first concept you find difficult and describe what you already understand."
        : "Describe the concept in your own words, then identify what you would like clarified.";
    case "question":
      return "Predict what happens next and explain the reasoning behind your prediction.";
    case "hint":
      return "Identify a relevant principle and use it to choose one next step.";
    case "practice":
      return policy.signals?.progress === "starting"
        ? "Choose a small example of the concept and attempt it one step at a time."
        : "Try a similar exercise, then compare your reasoning with a worked example.";
    case "reflect":
      return "Describe what changed in your understanding and what still needs practice.";
    case "retrieve":
      return "Recall the concept without notes, then check what you missed using your study material.";
  }
}
