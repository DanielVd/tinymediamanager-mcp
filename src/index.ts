#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
  // HTTP streamable-http mode for LibreChat and other HTTP-based MCP clients.
  // Each request gets its own stateless transport instance so no session state
  // needs to be managed across requests.
  const port = parseInt(process.env.TMM_HTTP_PORT ?? "8000", 10);
  const app = express();

  app.use(express.json());

  app.all("/mcp", async (req, res) => {
    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    });
    const server = buildServer();
    await server.connect(httpTransport);
    await httpTransport.handleRequest(req, res, req.body);
  });

  app.listen(port, () => {
    process.stderr.write(`tinymediamanager-mcp streamable-http listening on :${port}/mcp\n`);
  });
} else {
  // Default: stdio mode for Claude Code, Codex, opencode
  const server = buildServer();
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}
