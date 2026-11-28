# Contributing

Preceptor is under development. Read [AGENTS.md](AGENTS.md) before making changes.

Use Node.js 24 or later, pnpm 11.2.2 and the versions locked in the repository. From the root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

Use `pnpm test` for the full test suite, `pnpm format` to format files and `pnpm check:style` for non-mutating style checks. The full check also builds the package and installs its local archive in an independent offline consumer.

Open focused pull requests with the approved scope, tests and any outstanding limitations. Use synthetic learner data in tests. Contributions must comply with [Apache-2.0](LICENSE). Do not transfer private code or contribute material without confirmed rights.
