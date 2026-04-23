#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { clientFromEnv } from "./client.js";
import { buildTools } from "./tools.js";

function buildServer() {
  const server = new McpServer({
    name: "tinymediamanager-mcp",
    version: "1.0.0",
  });

  const client = clientFromEnv();
  const tools = buildTools(client);

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema.shape },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any) => {
        const text = await tool.handler(args);
        return { content: [{ type: "text" as const, text }] };
      }
    );
  }

  return server;
}

const transport = process.env.TMM_TRANSPORT ?? "stdio";

if (transport === "http") {
  // HTTP/SSE mode for LibreChat and other HTTP-based MCP clients
  const port = parseInt(process.env.TMM_HTTP_PORT ?? "8000", 10);
  const app = express();

  // Track active SSE transports keyed by session ID
  const sessions = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const sessionTransport = new SSEServerTransport("/messages", res);
    sessions.set(sessionTransport.sessionId, sessionTransport);

    res.on("close", () => sessions.delete(sessionTransport.sessionId));

    const server = buildServer();
    await server.connect(sessionTransport);
  });

  app.post("/messages", express.json(), async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const sessionTransport = sessions.get(sessionId);

    if (!sessionTransport) {
      res.status(400).json({ error: "Unknown session" });
      return;
    }

    await sessionTransport.handlePostMessage(req, res);
  });

  app.listen(port, () => {
    process.stderr.write(`tinymediamanager-mcp HTTP/SSE listening on :${port}\n`);
  });
} else {
  // Default: stdio mode for Claude Code, Codex, opencode
  const server = buildServer();
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}
