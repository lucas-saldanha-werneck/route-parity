// EXAMPLE DATA, invented for this demo. Not from any real company.
import { Hono } from "hono";

const app = new Hono();
app.get("/api/contacts", (c) => c.json([]));
app.post("/api/contacts", (c) => c.json({}));
app.get("/api/contacts/:contactId", (c) => c.json({}));
app.get("/healthz", (c) => c.text("ok"));
app.all("/webhooks/crm", (c) => c.text("ok"));
app.get("/api/export", (c) => c.text("csv"));
const cache = new Map<string, string>();
cache.get("not-a-route");
export default app;
