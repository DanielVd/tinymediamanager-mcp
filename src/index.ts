#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { clientFromEnv } from "./client.js";
import { buildTools } from "./tools.js";

const server = new McpServer({
  name: "tinymediamanager-mcp",
  version: "1.0.0",
});

const client = clientFromEnv();
const tools = buildTools(client);

for (const tool of tools) {
  // registerTool is the non-deprecated API; handler must return CallToolResult
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

const transport = new StdioServerTransport();
await server.connect(transport);
