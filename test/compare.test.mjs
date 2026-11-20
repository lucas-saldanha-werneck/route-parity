import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractGo, extractTs } from "../src/extract.mjs";
import { compare, report } from "../src/compare.mjs";

const r = (method, path) => ({ method, path, file: "f", line: 1 });

test("matching routes produce no gaps", () => {
  const res = compare([r("GET", "/a")], [r("GET", "/a")]);
  assert.equal(res.missingInTs.length, 0);
  assert.equal(res.extraInTs.length, 0);
});

test("ANY on either side covers every method", () => {
  const res = compare([r("ANY", "/w")], [r("POST", "/w")]);
  assert.equal(res.missingInTs.length, 0);
});

test("method gap is flagged on the same path", () => {
  const res = compare([r("GET", "/a/:param"), r("DELETE", "/a/:param")], [r("GET", "/a/:param")]);
  assert.equal(res.missingInTs.length, 1);
  assert.equal(res.methodGaps[0].route, "DELETE /a/:param");
});

test("bundled example: finds the two missing Go routes and one extra TS route", () => {
  const go = extractGo(readFileSync(new URL("../examples/go/main.go", import.meta.url), "utf8"), "main.go");
  const ts = extractTs(readFileSync(new URL("../examples/ts/app.ts", import.meta.url), "utf8"), "app.ts");
  const res = compare(go, ts);
  assert.deepEqual(res.missingInTs.map((x) => `${x.method} ${x.path}`).sort(), [
    "DELETE /api/contacts/:param",
    "GET /api/listings/:param/matches",
  ]);
  assert.deepEqual(res.extraInTs.map((x) => `${x.method} ${x.path}`), ["GET /api/export"]);
  assert.equal(res.methodGaps.length, 1);
  assert.match(report(res, { go: go.length, ts: ts.length }), /In Go, not in TypeScript \(2\)/);
});
