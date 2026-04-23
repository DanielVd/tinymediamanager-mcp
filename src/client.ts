import type { TmmCommand, TmmConfig, MediaType } from "./types.js";

// Sends one or more commands to the TMM HTTP API.
// The API returns 200 when commands are QUEUED, not when they complete.
// Command execution order is fixed internally: update → scrape → rename,
// regardless of the order commands appear in the request array.
export class TmmClient {
  private config: TmmConfig;

  constructor(config: TmmConfig) {
    this.config = config;
  }

  async send(type: MediaType, commands: TmmCommand[]): Promise<void> {
    const protocol = this.config.https ? "https" : "http";
    const url = `${protocol}://${this.config.host}:${this.config.port}/api/${type}`;

    // Disable TLS verification for internal/home server deployments with self-signed certs
    if (this.config.https) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.config.apiKey,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`TMM API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`);
    }
  }
}

export function clientFromEnv(): TmmClient {
  const host = process.env.TMM_HOST ?? "localhost";
  const https = process.env.TMM_HTTPS === "true" || process.env.TMM_HTTPS === "1";
  const port = parseInt(process.env.TMM_PORT ?? (https ? "443" : "7878"), 10);
  const apiKey = process.env.TMM_API_KEY ?? "";

  if (!apiKey) {
    throw new Error("TMM_API_KEY environment variable is required");
  }

  return new TmmClient({ host, port, apiKey, https });
}
