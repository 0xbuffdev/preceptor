export const POLICY_REVISION = "preceptor-policy-v1";

export type InstructionMode =
  | "guided_learning"
  | "ungraded_practice"
  | "retrieval_coaching"
  | "defense_preparation"
  | "assessment_locked";

export type Capability =
  | "lesson.read"
  | "memory.recall"
  | "memory.remember"
  | "memory.forget"
  | "practice.suggest";

export type InstructionIntent =
  | "explain"
  | "question"
  | "hint"
  | "practice"
  | "reflect"
  | "retrieve"
  | "prepare"
  | "process";

export type TeachingStrategy = Exclude<InstructionIntent, "prepare" | "process"> | "pause";

export interface LessonReference {
  readonly documentRef: string;
  readonly revision: string;
  readonly visibility: "public" | "restricted";
}

export interface HostPolicy {
  readonly policyRevision: typeof POLICY_REVISION;
  readonly sessionId: string;
  readonly mode: InstructionMode;
  readonly grants: readonly Capability[];
  readonly consent: readonly Capability[];
  readonly installed: readonly Capability[];
  readonly lesson?: LessonReference;
  readonly signals?: {
    readonly difficulty?: "low" | "medium" | "high";
    readonly progress?: "starting" | "practicing" | "reviewing";
  };
}

export interface InstructionRequest {
  readonly intent?: InstructionIntent;
  readonly assistance: "plan" | "generate";
}

export interface CapabilityDenial {
  readonly capability: Capability;
  readonly reason:
    | "mode_ceiling"
    | "not_granted"
    | "no_consent"
    | "not_installed"
    | "lesson_unavailable"
    | "public_criteria_required";
}

export interface InstructionPlan {
  readonly status: "completed";
  readonly policyRevision: typeof POLICY_REVISION;
  readonly mode: InstructionMode;
  readonly strategy: TeachingStrategy;
  readonly reason: "mode_default" | "requested_intent" | "unsupported_intent" | "assessment_locked";
  readonly capabilities: readonly Capability[];
  readonly denials: readonly CapabilityDenial[];
  readonly nextActions: readonly {
    readonly kind: "fixed_prompt";
    readonly text: string;
  }[];
}

export type PlanningResult =
  | InstructionPlan
  | {
      readonly status: "invalid_input";
      readonly reason: "invalid_host_policy" | "invalid_request";
    }
  | {
      readonly status: "unavailable";
      readonly policyRevision: typeof POLICY_REVISION;
      readonly reason: "model_unavailable";
    };
