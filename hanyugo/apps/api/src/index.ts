import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse } from "@hanyugo/shared";

type Bindings = {
  ENVIRONMENT: string;
  // DB: D1Database; // uncomment once the D1 binding is set up in wrangler.toml
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// Simple health check — this is the "hello world" that proves the Worker
// is deployed and reachable from the internet.
app.get("/api/health", (c) => {
  const body: HealthResponse = {
    ok: true,
    service: "hanyugo-api",
    timestamp: new Date().toISOString(),
  };
  return c.json(body);
});

// Placeholder route — will become "GET /api/lessons?level=1" once D1 is wired up.
app.get("/api/lessons", (c) => {
  return c.json({ message: "Lessons endpoint coming soon. Wire up D1 first." });
});

export default app;
