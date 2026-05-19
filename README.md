# tinymediamanager-mcp

![Node](https://img.shields.io/badge/node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

MCP server for [tinyMediaManager](https://www.tinymediamanager.org/). Exposes tMM HTTP API as tools for AI assistants.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Available Tools](#available-tools)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [License](#license)

## Features

- MCP tools wrapping core tMM automation flows
- Single-call workflow (`run_workflow`) for `new` scope correctness
- Works with Claude Desktop / Claude Code and generic MCP clients

## Requirements

- tinyMediaManager v4.3+ with HTTP API enabled
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

## Quick Start

### Claude Desktop

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

## Available Tools

| Tool | Description |
|------|-------------|
| `run_workflow` | Scan + scrape + rename in one call |
| `update_library` | Scan data sources for new/changed files |
| `scrape_metadata` | Fetch metadata from online scrapers |
| `rename_media` | Rename files using configured patterns |
| `download_subtitles` | Download subtitle files |
| `download_artwork` | Download missing posters/fanart |
| `download_trailers` | Download trailers |
| `fetch_ratings` | Refresh ratings |
| `reload_media_info` | Re-read technical metadata (v5.0.10+) |
| `export_library` | Export library from template |

All tools accept `type: "movie" | "tvshow"` and `scope` (`all`, `new`, `unscraped`, `path`, `dataSource`).

## Compatibility

- Server runtime: Node.js 18+
- tinyMediaManager API: v4.3+ (some tools require newer tMM versions)

## Troubleshooting

- empty results after update/scrape: use `run_workflow` in single call
- auth error: verify `TMM_API_KEY`
- connection refused: verify `TMM_HOST`, `TMM_PORT`, API enabled in tMM

## Security Notes

- Keep `TMM_API_KEY` in env vars, not hardcoded in repo
- Avoid exposing MCP command to untrusted users

## License

MIT
