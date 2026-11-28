import type { Capability, InstructionIntent, InstructionMode } from "../contracts/policy";

export const MODES = [
  "guided_learning",
  "ungraded_practice",
  "retrieval_coaching",
  "defense_preparation",
  "assessment_locked",
] as const satisfies readonly InstructionMode[];

export const CAPABILITIES = [
  "lesson.read",
  "memory.recall",
  "memory.remember",
  "memory.forget",
  "practice.suggest",
] as const satisfies readonly Capability[];

export const INTENTS = [
  "explain",
  "question",
  "hint",
  "practice",
  "reflect",
  "retrieve",
  "prepare",
  "process",
] as const satisfies readonly InstructionIntent[];
