# Model-free policy

The pure planner requires no model or provider. Pass a host-authenticated policy and a separate request to `planInstruction`. The host establishes identity, authorized mode, lesson revision, grants, consent and installed capability names; the library validates their structure. Never populate these authority fields from learner or model input.

```ts
import { type HostPolicy, planInstruction, POLICY_REVISION } from "@0xbuff/preceptor";

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
```

A plan contains the policy revision, mode, strategy, reason, effective capability names, typed capability denials and fixed teaching prompts. The prompts do not claim to have read lessons, inspected work or evaluated a learner. A generation request returns `model_unavailable`; the assessment lock instead returns only fixed public process guidance and no capabilities.

Grants, consent and installed operations are explicit lists of capability names, intersected with the host mode ceiling. Empty lists grant nothing. Lesson access also requires an exact document reference and revision; defense preparation requires public criteria. Installed capability names describe availability, not actual callable adapters; dispatch is not implemented yet.

Unknown fields, modes, revisions, intents, duplicate capabilities, invalid references and malformed data are rejected with fixed diagnostic reasons. Identifiers are nonempty, trimmed and at most 256 UTF-8 bytes. Optional host signals are non-credit difficulty (`low`, `medium`, `high`) and progress (`starting`, `practicing`, `reviewing`). They can affect a fixed prompt but cannot expand permissions.

Pass inert plain data, for example decoded JSON from a bounded transport. Accessors and unusual prototypes are rejected; object validation is not a sandbox for executable JavaScript proxies. The host remains responsible for authenticating requests, scoping adapters and enforcing consent when operations are eventually invoked.
