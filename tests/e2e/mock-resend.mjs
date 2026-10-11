// A stand-in for Resend's HTTP API, for the e2e suite (Spec §26 Phase 10: "success only on
// Resend 2xx (mocked in e2e)"). POST /emails answers 200 with an id — or 500 when the brief's
// text contains "[fail]" — and records every delivery; GET /sent lists them; POST /reset clears.
// No real email is ever sent by the tests.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_RESEND_PORT || 3101);
let sent = [];

createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    if (req.method === "POST" && req.url === "/emails") {
      let json = null;
      try {
        json = JSON.parse(body);
      } catch {}
      const text = json?.text ?? "";
      if (!req.headers.authorization?.startsWith("Bearer ") || !json) {
        res.writeHead(401, { "content-type": "application/json" }).end(JSON.stringify({ message: "unauthorized" }));
        return;
      }
      if (text.includes("[fail]")) {
        res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ message: "mock failure" }));
        return;
      }
      sent.push({ at: Date.now(), ...json });
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ id: `mock-${sent.length}` }));
      return;
    }
    if (req.method === "GET" && req.url === "/sent") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(sent));
      return;
    }
    if (req.method === "POST" && req.url === "/reset") {
      sent = [];
      res.writeHead(204).end();
      return;
    }
    res.writeHead(200, { "content-type": "text/plain" }).end("mock resend");
  });
}).listen(PORT, () => console.log(`mock resend on :${PORT}`));
