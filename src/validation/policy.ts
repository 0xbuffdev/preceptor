import {
  type Capability,
  type HostPolicy,
  type InstructionRequest,
  type LessonReference,
  POLICY_REVISION,
} from "../contracts/policy";
import { CAPABILITIES, INTENTS, MODES } from "../contracts/vocabulary";

function record(
  value: unknown,
  allowed: readonly string[],
): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return;
  const keys = Reflect.ownKeys(value);
  if (keys.length > allowed.length) return;
  const snapshot: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    if (typeof key !== "string" || !allowed.includes(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return;
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return options.some((option) => option === value);
}

function identifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    value.trim() === value &&
    new TextEncoder().encode(value).length <= 256
  );
}

function capabilities(value: unknown): Capability[] | undefined {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return;
  const length: unknown = Object.getOwnPropertyDescriptor(value, "length")?.value;
  if (
    typeof length !== "number" ||
    !Number.isSafeInteger(length) ||
    length < 0 ||
    length > CAPABILITIES.length
  ) return;
  if (Reflect.ownKeys(value).length !== length + 1) return;
  const result: Capability[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return;
    const item: unknown = descriptor.value;
    if (!oneOf(item, CAPABILITIES) || result.includes(item)) return;
    result.push(item);
  }
  return result;
}

function lesson(value: unknown): LessonReference | undefined {
  const data = record(value, ["documentRef", "revision", "visibility"]);
  if (
    !data ||
    !identifier(data.documentRef) ||
    !identifier(data.revision) ||
    !oneOf(data.visibility, ["public", "restricted"] as const)
  ) {
    return;
  }
  return { documentRef: data.documentRef, revision: data.revision, visibility: data.visibility };
}

function signals(value: unknown): NonNullable<HostPolicy["signals"]> | undefined {
  const data = record(value, ["difficulty", "progress"]);
  if (!data) return;
  const result: {
    difficulty?: "low" | "medium" | "high";
    progress?: "starting" | "practicing" | "reviewing";
  } = {};
  if (Object.hasOwn(data, "difficulty")) {
    if (!oneOf(data.difficulty, ["low", "medium", "high"] as const)) return;
    result.difficulty = data.difficulty;
  }
  if (Object.hasOwn(data, "progress")) {
    if (!oneOf(data.progress, ["starting", "practicing", "reviewing"] as const)) return;
    result.progress = data.progress;
  }
  return result;
}

export function validateHostPolicy(value: unknown): HostPolicy | undefined {
  const data = record(value, [
    "policyRevision",
    "sessionId",
    "mode",
    "grants",
    "consent",
    "installed",
    "lesson",
    "signals",
  ]);
  if (
    !data ||
    data.policyRevision !== POLICY_REVISION ||
    !identifier(data.sessionId) ||
    !oneOf(data.mode, MODES)
  ) {
    return;
  }
  const grants = capabilities(data.grants);
  const consent = capabilities(data.consent);
  const installed = capabilities(data.installed);
  if (!grants || !consent || !installed) return;
  const source = Object.hasOwn(data, "lesson") ? lesson(data.lesson) : undefined;
  if (Object.hasOwn(data, "lesson") && !source) return;
  const contextSignals = Object.hasOwn(data, "signals") ? signals(data.signals) : undefined;
  if (Object.hasOwn(data, "signals") && !contextSignals) return;
  return {
    policyRevision: POLICY_REVISION,
    sessionId: data.sessionId,
    mode: data.mode,
    grants,
    consent,
    installed,
    ...(source ? { lesson: source } : {}),
    ...(contextSignals ? { signals: contextSignals } : {}),
  };
}

export function validateRequest(value: unknown): InstructionRequest | undefined {
  const data = record(value, ["intent", "assistance"]);
  if (!data || !oneOf(data.assistance, ["plan", "generate"] as const)) return;
  if (Object.hasOwn(data, "intent")) {
    if (!oneOf(data.intent, INTENTS)) return;
    return { assistance: data.assistance, intent: data.intent };
  }
  return { assistance: data.assistance };
}
