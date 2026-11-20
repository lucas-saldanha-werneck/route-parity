// Pull HTTP routes out of source text with regexes. No parser, no dependencies.
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// Turn {id}, {id...}, :id, *name into :param so Go and TS spellings compare equal.
export function normalizePath(p) {
  let out = p.trim().replace(/\{[^}/]*\}/g, ":param").replace(/:[A-Za-z_][A-Za-z0-9_]*\??/g, ":param");
  out = out.replace(/\*[A-Za-z0-9_]*/g, ":param");
  out = out.replace(/\/{2,}/g, "/");
  if (out.length > 1) out = out.replace(/\/+$/, "");
  return out.startsWith("/") ? out : "/" + out;
}

function line(src, index) {
  return src.slice(0, index).split("\n").length;
}

// Go: net/http 1.22 ("GET /x"), chi (r.Get), gin/echo (r.GET).
export function extractGo(src, file = "") {
  const routes = [];
  const std = /\.(?:HandleFunc|Handle)\(\s*"(?:([A-Z]+)\s+)?([^"\s]+)"/g;
  const verb = /\.(Get|Post|Put|Patch|Delete|Head|Options|GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\(\s*"([^"]+)"/g;
  let m;
  while ((m = std.exec(src))) {
    routes.push({ method: m[1] || "ANY", path: normalizePath(m[2]), raw: m[2], file, line: line(src, m.index) });
  }
  while ((m = verb.exec(src))) {
    routes.push({ method: m[1].toUpperCase(), path: normalizePath(m[2]), raw: m[2], file, line: line(src, m.index) });
  }
  return routes;
}

// TypeScript: Hono / Express / Fastify style app.get("/x", ...).
export function extractTs(src, file = "") {
  const routes = [];
  const re = /\b\w+\.(get|post|put|patch|delete|head|options|all)\(\s*["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const path = m[2];
    if (!path.startsWith("/") && path !== "*") continue; // skip map.get("key") and friends
    routes.push({ method: m[1] === "all" ? "ANY" : m[1].toUpperCase(), path: normalizePath(path), raw: path, file, line: line(src, m.index) });
  }
  return routes;
}

export { METHODS };
