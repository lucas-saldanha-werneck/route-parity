# route-parity

Lists the HTTP routes a Go backend has that its TypeScript port does not, and the other way round.

Independent demo, not affiliated with FullStack (cliente não diz). I built it after applying for a Full Stack AI Engineer role (Go and TypeScript, with a Go to TypeScript migration mentioned in the posting). It is my own small tool and uses no company data.

## What it does

During a backend migration, a route that exists in the old service and was never ported is easy to miss. `route-parity` reads the source text of both services, pulls out the routes, and prints the difference.

It understands these styles:

- Go: chi (`r.Get("/x", h)`), gin and echo (`r.GET("/x", h)`), and `net/http` with or without a method (`"GET /x"`, `"/x"`).
- TypeScript or JavaScript: Hono, Express and Fastify style calls (`app.get("/x", h)`, `app.all(...)`).

Path parameters are normalized, so `/users/{id}` in Go matches `/users/:userId` in TypeScript. A route with no method (Go `HandleFunc("/x")`, TS `app.all`) counts as matching any method on that path. If the same path exists in both but a method is missing, the report says so.

## Run it

Needs Node 20 or newer. No dependencies.

```sh
node src/cli.mjs examples/go examples/ts
node src/cli.mjs <go-dir> <ts-dir> --json
npm test
```

Exit code is 1 when a Go route has no TypeScript match, 0 otherwise, 2 for bad arguments. That makes it usable as a CI check on a migration branch.

Output on the bundled example:

```
Go routes: 7. TypeScript routes: 6. Matched: 5.

## In Go, not in TypeScript (2)
- `DELETE /api/contacts/:param` (main.go:15)
- `GET /api/listings/:param/matches` (main.go:16)

## In TypeScript, not in Go (1)
- `GET /api/export` (app.ts:10)
```

The files in `examples/` are invented example data.

## What was tested

- 11 automated tests with `node --test`, all offline, run in GitHub Actions on every push.
- Path normalization for `{id}`, `:id`, `{path...}`, trailing slashes.
- Route extraction for chi, gin-style, `net/http` (both forms) and Hono-style calls, including line numbers and skipping `Map.get("key")`.
- The comparison logic, including the "any method" case and the method-gap case.
- The command line: exit codes, text output and `--json` on the example.

## What was not tested

- Real codebases. I did not run it on any production Go or TypeScript service.
- Route groups and prefixes: chi `r.Route("/api", ...)`, gin `Group`, Hono `app.route()`. The tool sees only the literal path in each call, so a prefixed route will be reported wrong.
- Routes built from variables or constants, and middleware-only registrations.
- Go regex-style or wildcard patterns beyond simple `{name}` and `*`.
- Whether two matching routes behave the same. It compares paths and methods only, not request or response shapes.
- Go code is read as text, not compiled. I have not shipped Go in production; this tool does not need Go to be installed.
