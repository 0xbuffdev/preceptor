# AGENTS.md

Repository-wide instructions for working on Preceptor.

## Contract and scope

Preceptor is a portable instructional engine. It selects teaching strategies and coordinates optional model assistance, scoped tools and learner memory. Its outputs are advisory; formal academic authority belongs to the host.

- Before changing behavior, read the [Preceptor specification](https://github.com/0xbuffdev/context/blob/main/repos/preceptor/specs/0001-instruction-engine.md), [ADR](https://github.com/0xbuffdev/context/blob/main/repos/preceptor/adr/0001-independent-instruction.md) and [implementation tickets](https://github.com/0xbuffdev/context/blob/main/repos/preceptor/tickets.md). Check acceptance status, dependencies and required tests.
- Accepted contracts govern intended behavior; source, tests and package exports establish implemented behavior. Report contradictions and missing approvals. Do not implement proposed amendments as though accepted.
- Keep the library independently useful without a model, network, account, database, framework, OEE curriculum, Assay, Retention or MemoFS. Inject optional providers. Do not import private application code or introduce mandatory provider SDKs, telemetry or host services.
- Keep public documentation about implemented behavior and reader tasks. Track ticket IDs and requirement coverage in the canonical tracker and PRs, not user-facing guides.

## Working on a ticket

- Start from current `main` on a focused branch unless continuing an existing PR. Inspect the working tree and preserve unrelated changes. Implement one accepted ticket per PR; do not pull in blocked or optional follow-ups.
- Identify affected contracts, dependency boundaries and acceptance cases before editing. Keep scope small, finish the required behavior and remove superseded code within approved changes. Avoid speculative abstractions, parallel implementations and compatibility aliases for unreleased APIs.
- Follow the source layout in specification 0001 §9.1. Keep contracts and validation, policy and strategy, session orchestration, dispatch, ports, memory and summaries separate. Add directories when real code or tests need them.
- Contracts, policy and projections must not depend on providers. Orchestration depends on validated contracts, policy and injected ports; adapters depend on the public API, never the reverse.
- Keep a small, explicit public API through `src/index.ts` and approved entry points. No wildcard deep exports, import-time I/O, environment lookup, provider construction, persistent storage or shared mutable session state. Update types, tests, examples and package verification together for approved public changes.

## Instruction and authorization

- Validate session inputs before any port invocation. The host binds identity, mode, lesson revision, grants, consent and scope; the library validates structure, not authenticity. A learner or model cannot change authority.
- Keep model-free policy deterministic for identical validated inputs and policy revisions. No implicit time, randomness or I/O in planning. Fixed prompts must not pretend to inspect work or generate feedback; missing model support is explicitly unavailable.
- Compute effective capabilities from the mode ceiling, host grants, consent and installed operations. Default deny. In `assessment_locked`, return fixed public process guidance without invoking model, lesson, transcript, memory or practice operations.
- Treat learner text, lesson content, model output, history, memory and tool results as untrusted data. Validate exact lesson identity and revision; no fallback disclosure. Keep trusted policy separate from untrusted context. Text delimiters do not establish authorization.
- Use the closed typed dispatcher. Validate operation, arguments, call identity, permissions and remaining budget before every invocation. Models request operations; they never receive callable adapters, arbitrary RPC, identity selectors or provider auto-execution. Count denied and invalid attempts.
- Never expose grade writes, formal admission, hidden assessment material, rubric modification, credentials, payment or enrollment operations. Tutoring, defense rehearsal, practice feedback and review readiness do not confer academic credit.

## Resource limits and failures

- Enforce the versioned ceilings and failure semantics in specification 0001 §9.3–9.4. Validate limits and bound UTF-8 bytes, structured input complexity, requests, outputs and tool attempts. Apply the narrowest allowed limit; a request cannot enlarge host or library limits.
- Use one monotonic deadline per run. Forward cancellation, race noncooperative calls against termination, discard late results and stop further dispatch. Retry only permitted transient operations within budget. Do not replay ambiguous mutations without the same authorized idempotency identity.
- Distinguish completed advisory results, unavailable or incomplete context, denials, invalid input, exhausted limits, cancellation and deadline failures. Preserve bounded provenance and usage; never fabricate success or expose raw exceptions, secrets or private content.
- Adapter-reported tokens are not independently enforced caps. The host owns remote cancellation, transport limits, quotas and costs. A committed memory operation is not rolled back automatically when later generation fails.

## Memory and committed summaries

- Keep narrative facts, transcripts, committed academic summaries and scheduling advice separate. No shared mutable mastery field or implicit persistence. Missing optional memory or review providers must not break pure planning.
- Memory writes are bounded proposals. The host assigns actor and lineage and atomically enforces scope, consent, expected revisions and idempotency. Learner edits take precedence; model forget is restricted to eligible, recalled, model-owned facts.
- Suppress stale callbacks and replay after deletion or consent revocation without preserving deleted prose as a denylist. The host owns export, physical erasure, backups and suppression-marker retention.
- Accept only minimal authorized after-commit summaries through the separate host-only interface. Preserve full-snapshot revision semantics, duplicate handling, conflict withholding and revocation. Do not ingest raw Assay findings as official credit or expose ingestion to the model. Retention advice is optional, versioned and advisory.

## Toolchain and validation

Use Node.js 24+, pnpm 11.2.2, TypeScript 5.9.3, ESM, tsdown, Vitest and Biome as configured in the repository. Keep tooling development-only; typecheck independently of bundling. Follow Biome and do not edit generated `dist/` files.

From the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec vitest run tests/unit/foundation.test.ts
pnpm check
```

Use `pnpm format` to format files and `pnpm check:style` for non-mutating style checks. Run `pnpm build` then `pnpm verify:package` for standalone archive verification.

- Add focused positive, negative and boundary tests for every changed behavior. Use deterministic fixtures, exhaustive mode/capability tables, malformed inputs, adversarial context, budget and cancellation cases, scoped memory races, deletion replay and summary revision conflicts as applicable.
- Use synthetic data and private-data canaries; never use real learner records, credentials, hidden assessment cases or private prompts in fixtures or package artifacts.
- Keep independent offline ESM/TypeScript packed-consumer checks, export allowlists, import-side-effect checks and dependency checks aligned with approved changes. Do not weaken tests, skip cases or relax architecture guards to obtain a pass.
- Run focused tests during development and all applicable configured checks before review. Record exact tested commit, commands, results and skipped or unavailable checks. Separate pure library, reference adapter, real host and real-provider evidence. Mock tests cannot certify external tenant isolation, erasure or provider billing.

## Review and release

- Prioritize fail-open permissions, assessment-lock bypass, prompt-driven authority changes, scope or privacy leaks, stale memory resurrection, forged credit, unbounded execution, incorrect failure states and dependency violations. Include file/line, triggering condition, impact and a testable correction.
- PRs must identify the ticket, requirement coverage, tests and outstanding limitations. Do not mark a ticket done before required review, merge and acceptance evidence.
- Source rights, licensing, package publication and host deployment have separate approvals. Preserve Apache-2.0 licensing and copyright notices. Do not infer contributor rights from the license. Verify the exact candidate artifact, provenance and independent consumer before release.
- No merge, publication, version tag, deployment, signing on behalf of the maintainer or ownership/visibility change without explicit authorization.
