import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const nodeDir = path.dirname(process.execPath);
const npmEntry = [
  path.join(nodeDir, "node_modules/npm/bin/npm-cli.js"),
  path.join(nodeDir, "../lib/node_modules/npm/bin/npm-cli.js"),
  path.join(nodeDir, "../node_modules/npm/bin/npm-cli.js"),
].find((candidate) => existsSync(candidate));
assert.ok(npmEntry, "Use Node.js with its bundled npm CLI");

function run(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_offline: "true",
      npm_config_audit: "false",
      npm_config_fund: "false",
      npm_config_update_notifier: "false",
    },
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || "Command failed");
  }
  return result.stdout;
}

const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert.equal(manifest.name, "@0xbuff/preceptor");
assert.equal(manifest.private, true);
assert.equal(manifest.license, "UNLICENSED");
assert.equal(manifest.type, "module");
assert.deepEqual(manifest.exports, {
  ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
});
for (const field of [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundledDependencies",
  "bundleDependencies",
]) {
  assert.equal(Object.keys(manifest[field] ?? {}).length, 0, field);
}
for (const spec of Object.values(manifest.devDependencies ?? {})) {
  assert.match(spec, /^\d+\.\d+\.\d+$/);
}
for (const script of [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepack",
  "postpack",
  "prepublish",
  "prepublishOnly",
  "publish",
  "postpublish",
]) {
  assert.ok(!Object.hasOwn(manifest.scripts, script), script);
}
// This guard describes the foundation only. Later accepted tickets extend it
// with module dependency and public export checks for their actual code.
assert.deepEqual(await readdir(path.join(root, "src")), ["index.ts"]);
const source = await readFile(path.join(root, "src/index.ts"), "utf8");
assert.equal(source.replace(/^\/\/.*$/gm, "").trim(), "export {};");

const workspace = await mkdtemp(path.join(tmpdir(), "preceptor-consumer-"));
try {
  const archiveDir = path.join(workspace, "archive");
  const consumerDir = path.join(workspace, "consumer");
  await mkdir(archiveDir);
  await mkdir(consumerDir);
  const packed = JSON.parse(
    run(
      [
        npmEntry,
        "pack",
        "--offline",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        archiveDir,
      ],
      root,
    ),
  );
  assert.equal(packed.length, 1);
  const item = packed[0];
  assert.equal(item.name, manifest.name);
  assert.equal(item.version, manifest.version);
  assert.match(item.filename, /^[A-Za-z0-9._-]+\.tgz$/);
  assert.deepEqual(
    item.files.map((file) => file.path).sort(),
    ["CHANGELOG.md", "README.md", "dist/index.d.ts", "dist/index.js", "package.json"],
  );

  await writeFile(
    path.join(consumerDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    [
      npmEntry,
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      "--no-save",
      "--omit=dev",
      path.join(archiveDir, item.filename),
    ],
    consumerDir,
  );
  const modules = path.join(consumerDir, "node_modules");
  assert.deepEqual((await readdir(modules)).filter((name) => !name.startsWith(".")), ["@0xbuff"]);
  assert.deepEqual(await readdir(path.join(modules, "@0xbuff")), ["preceptor"]);
  const installed = path.join(modules, "@0xbuff/preceptor");
  assert.deepEqual(
    JSON.parse(await readFile(path.join(installed, "package.json"), "utf8")),
    manifest,
  );
  for (const file of ["consumer.mjs", "consumer.ts"]) {
    await copyFile(path.join(root, "tests/consumer", file), path.join(consumerDir, file));
  }
  run(["consumer.mjs"], consumerDir);
  run(
    [
      require.resolve("typescript/bin/tsc"),
      "--strict",
      "--noEmit",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "consumer.ts",
    ],
    consumerDir,
  );
  console.log("Independent offline ESM and TypeScript package checks passed.");
} finally {
  await rm(workspace, { recursive: true, force: true });
}
