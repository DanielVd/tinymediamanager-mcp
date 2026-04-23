# tinymediamanager-mcp

MCP server for [tinyMediaManager](https://www.tinymediamanager.org/) — exposes the tMM HTTP API as tools for AI assistants (Claude, etc.).

## Requirements

- tinyMediaManager v4.3+ with HTTP API enabled (Settings → General → HTTP API)
- Node.js 18+

## Installation

```bash
npm install
npm run build
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TMM_HOST` | `localhost` | tMM host |
| `TMM_PORT` | `7878` | tMM HTTP API port |
| `TMM_API_KEY` | *(required)* | API key from tMM settings |

## Usage

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tinymediamanager": {
      "command": "node",
      "args": ["/path/to/tinymediamanager-mcp/dist/index.js"],
      "env": {
        "TMM_HOST": "localhost",
        "TMM_PORT": "7878",
        "TMM_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
TMM_API_KEY=your-key claude mcp add tinymediamanager -- node /path/to/dist/index.js
```

### Manual test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | TMM_API_KEY=your-key node dist/index.js
```

## Available Tools

| Tool | Description |
|------|-------------|
| `run_workflow` | Scan + scrape + rename in one call (handles `new` scope correctly) |
| `update_library` | Scan data sources for new/changed files |
| `scrape_metadata` | Fetch metadata from online scrapers |
| `rename_media` | Rename files using configured patterns |
| `download_subtitles` | Download subtitle files |
| `download_artwork` | Download missing posters, fanart, banners |
| `download_trailers` | Download trailers |
| `fetch_ratings` | Refresh ratings from online sources |
| `reload_media_info` | Re-read technical metadata from files (v5.0.10+) |
| `export_library` | Export library using a tMM template |

All tools accept `type: "movie" | "tvshow"` and a `scope` parameter (`all`, `new`, `unscraped`, `path`, `dataSource`).

> **Note:** The tMM API queues commands and returns immediately — processing happens in the background.

## Key Behavior

The `run_workflow` tool exists because `scope: "new"` in tMM only resolves items discovered within the **same API call** as `update`. Sending update and scrape in separate requests means scrape finds nothing. `run_workflow` batches all three actions (update → scrape → rename) in one call.

## License

MIT
