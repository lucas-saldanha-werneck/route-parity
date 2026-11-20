const key = (r) => `${r.method} ${r.path}`;

// An "ANY" route (Go HandleFunc without a method, Hono app.all) covers every method on that path.
function covers(list, r) {
  return list.some((x) => x.path === r.path && (x.method === r.method || x.method === "ANY" || r.method === "ANY"));
}

export function compare(goRoutes, tsRoutes) {
  const missingInTs = goRoutes.filter((r) => !covers(tsRoutes, r));
  const extraInTs = tsRoutes.filter((r) => !covers(goRoutes, r));
  const matched = goRoutes.filter((r) => covers(tsRoutes, r));
  // Same path, different method: usually a method that was forgotten, not a missing route.
  const methodGaps = missingInTs
    .filter((r) => tsRoutes.some((x) => x.path === r.path))
    .map((r) => ({ route: key(r), tsMethods: tsRoutes.filter((x) => x.path === r.path).map((x) => x.method) }));
  return { matched, missingInTs, extraInTs, methodGaps };
}

export function report(result, total) {
  const L = [];
  L.push(`# Route parity`);
  L.push(``);
  L.push(`Go routes: ${total.go}. TypeScript routes: ${total.ts}. Matched: ${result.matched.length}.`);
  L.push(``);
  L.push(`## In Go, not in TypeScript (${result.missingInTs.length})`);
  for (const r of result.missingInTs) L.push(`- \`${key(r)}\` (${r.file}:${r.line})`);
  if (!result.missingInTs.length) L.push(`- none`);
  L.push(``);
  L.push(`## In TypeScript, not in Go (${result.extraInTs.length})`);
  for (const r of result.extraInTs) L.push(`- \`${key(r)}\` (${r.file}:${r.line})`);
  if (!result.extraInTs.length) L.push(`- none`);
  if (result.methodGaps.length) {
    L.push(``);
    L.push(`## Same path, method differs`);
    for (const g of result.methodGaps) L.push(`- \`${g.route}\`: TypeScript has ${g.tsMethods.join(", ")} on that path`);
  }
  return L.join("\n") + "\n";
}
