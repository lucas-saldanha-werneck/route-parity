import { test } from "node:test";
import assert from "node:assert/strict";
import { extractGo, extractTs, normalizePath } from "../src/extract.mjs";

test("normalizePath unifies Go and TS param styles", () => {
  assert.equal(normalizePath("/users/{id}"), "/users/:param");
  assert.equal(normalizePath("/users/:userId/"), "/users/:param");
  assert.equal(normalizePath("/files/{path...}"), "/files/:param");
  assert.equal(normalizePath("users"), "/users");
  assert.equal(normalizePath("/"), "/");
});

test("extractGo reads chi, net/http 1.22 and plain HandleFunc", () => {
  const src = `r.Get("/a/{id}", h)\nmux.HandleFunc("POST /b", h)\nmux.HandleFunc("/c", h)\nr.GET("/d/:id", h)`;
  const got = extractGo(src, "x.go").map((r) => `${r.method} ${r.path}`);
  assert.deepEqual(got.sort(), ["ANY /c", "GET /a/:param", "GET /d/:param", "POST /b"].sort());
});

test("extractGo records line numbers", () => {
  const r = extractGo(`package x\n\nr.Get("/a", h)`, "x.go");
  assert.equal(r[0].line, 3);
});

test("extractTs reads Hono/Express routes and ignores Map.get", () => {
  const src = `app.get("/a/:id", h)\napp.post('/b', h)\napp.all("/c", h)\ncache.get("key")`;
  const got = extractTs(src, "a.ts").map((r) => `${r.method} ${r.path}`);
  assert.deepEqual(got, ["GET /a/:param", "POST /b", "ANY /c"]);
});
