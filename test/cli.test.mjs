import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cli = new URL("../src/cli.mjs", import.meta.url).pathname;
const run = (...a) => spawnSync(process.execPath, [cli, ...a], { encoding: "utf8" });

test("cli exits 1 and lists gaps on the example", () => {
  const p = run("examples/go", "examples/ts");
  assert.equal(p.status, 1);
  assert.match(p.stdout, /DELETE \/api\/contacts\/:param/);
});

test("cli --json is valid JSON", () => {
  const p = run("examples/go", "examples/ts", "--json");
  assert.equal(JSON.parse(p.stdout).missingInTs.length, 2);
});

test("cli exits 2 without arguments", () => {
  assert.equal(run().status, 2);
});
