# tinymediamanager-mcp

[![Latest Release](https://img.shields.io/github/v/release/DanielVd/tinymediamanager-mcp)](https://github.com/DanielVd/tinymediamanager-mcp/releases/latest)
![Node](https://img.shields.io/badge/node-18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

MCP server for tinyMediaManager HTTP API automation.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Tools](#tools)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)

## Features

- Wraps tMM API into MCP tools
- Includes `run_workflow` for `new` scope reliability

## Requirements

- tinyMediaManager 4.3+
- Node.js 18+

## Installation

```bash
npm install
npm run build
```

## Configuration

- `TMM_HOST` (default `localhost`)
- `TMM_PORT` (default `7878`)
- `TMM_API_KEY` (required)

## Quick Start

```bash
TMM_API_KEY=your-key claude mcp add tinymediamanager -- node /path/to/dist/index.js
```

## Tools

`run_workflow`, `update_library`, `scrape_metadata`, `rename_media`, `download_subtitles`, `download_artwork`, `download_trailers`, `fetch_ratings`, `reload_media_info`, `export_library`

## Troubleshooting

- empty scrape on `new`: use `run_workflow`
- auth errors: verify API key

## Security Notes

- keep API key in env vars
