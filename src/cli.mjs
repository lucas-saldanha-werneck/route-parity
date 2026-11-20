#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { extractGo, extractTs } from "./extract.mjs";
import { compare, report } from "./compare.mjs";

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "vendor" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e)) && !name.endsWith("_test.go") && !name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

function collect(dir, exts, extract) {
  return walk(dir, exts).flatMap((f) => extract(readFileSync(f, "utf8"), relative(dir, f)));
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const [goDir, tsDir] = args.filter((a) => !a.startsWith("--"));
if (!goDir || !tsDir) {
  console.error("usage: route-parity <go-dir> <ts-dir> [--json]");
  process.exit(2);
}
const go = collect(goDir, [".go"], extractGo);
const ts = collect(tsDir, [".ts", ".tsx", ".js", ".mjs"], extractTs);
const result = compare(go, ts);
if (json) console.log(JSON.stringify(result, null, 2));
else process.stdout.write(report(result, { go: go.length, ts: ts.length }));
process.exit(result.missingInTs.length ? 1 : 0);
