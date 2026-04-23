import { z } from "zod";
import type { TmmClient } from "./client.js";
import type { TmmCommand, MediaType } from "./types.js";

// Shared input schemas
const mediaTypeSchema = z.enum(["movie", "tvshow"]).describe("Media type: movie or tvshow");

const actionScopeSchema = z
  .enum(["all", "new", "unscraped", "path", "dataSource"])
  .default("new")
  .describe("Scope for the action");

const pathsSchema = z
  .array(z.string())
  .optional()
  .describe("File/directory paths (required when scope is 'path')");

// Build a scope object from scope name and optional path args
function buildScope(name: string, paths?: string[]): TmmCommand["scope"] {
  if (paths && paths.length > 0) {
    return { name, args: paths };
  }
  return { name };
}

// Tool definitions — each returns { name, description, inputSchema, handler }
export function buildTools(client: TmmClient) {
  return [
    // -------------------------------------------------------------------------
    // run_workflow: scan + scrape + rename in a single batched API call.
    // "new" scope only works when update is in the same call, so this tool
    // combines all three actions to correctly chain them.
    // -------------------------------------------------------------------------
    {
      name: "run_workflow",
      description:
        "Run the standard tinyMediaManager workflow: scan data sources, scrape new items, and rename them. " +
        "All three actions are sent in one API call so 'new' scope resolves correctly.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scraper: z
          .string()
          .optional()
          .describe("Metadata scraper ID (e.g. tmdb, tvdb, universal_movie). Uses tMM default if omitted."),
      }),
      async handler({ type, scraper }: { type: MediaType; scraper?: string }) {
        const scrapeArgs = scraper ? { scraper } : undefined;
        const commands: TmmCommand[] = [
          { action: "update", scope: { name: "all" } },
          { action: "scrape", scope: { name: "new" }, args: scrapeArgs },
          { action: "rename", scope: { name: "new" } },
        ];
        await client.send(type, commands);
        return `Workflow queued for ${type}s (update + scrape + rename). Processing runs in the background.`;
      },
    },

    // -------------------------------------------------------------------------
    // update_library: scan data sources for new/changed media files
    // -------------------------------------------------------------------------
    {
      name: "update_library",
      description: "Scan tinyMediaManager data sources to detect new or changed media files.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: z.enum(["all", "path", "show"]).default("all").describe("'all' scans every source; 'path'/'show' targets specific paths"),
        paths: pathsSchema,
      }),
      async handler({ type, scope, paths }: { type: MediaType; scope: string; paths?: string[] }) {
        const commands: TmmCommand[] = [{ action: "update", scope: buildScope(scope, paths) }];
        await client.send(type, commands);
        return `Library update queued for ${type}s (scope: ${scope}).`;
      },
    },

    // -------------------------------------------------------------------------
    // scrape_metadata: fetch metadata from online scrapers
    // -------------------------------------------------------------------------
    {
      name: "scrape_metadata",
      description: "Fetch metadata for movies or TV shows from online scrapers.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
        scraper: z
          .string()
          .optional()
          .describe("Scraper ID: tmdb, imdb, tvdb, anidb, trakt, universal_movie, omdbapi, ofdb, moviemeter, mpdbtv"),
      }),
      async handler({ type, scope, paths, scraper }: { type: MediaType; scope: string; paths?: string[]; scraper?: string }) {
        const args = scraper ? { scraper } : undefined;
        const commands: TmmCommand[] = [{ action: "scrape", scope: buildScope(scope, paths), args }];
        await client.send(type, commands);
        return `Scrape queued for ${type}s (scope: ${scope}${scraper ? `, scraper: ${scraper}` : ""}).`;
      },
    },

    // -------------------------------------------------------------------------
    // rename_media: apply renamer patterns to media files
    // -------------------------------------------------------------------------
    {
      name: "rename_media",
      description: "Rename media files using the configured tinyMediaManager renamer patterns.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
      }),
      async handler({ type, scope, paths }: { type: MediaType; scope: string; paths?: string[] }) {
        const commands: TmmCommand[] = [{ action: "rename", scope: buildScope(scope, paths) }];
        await client.send(type, commands);
        return `Rename queued for ${type}s (scope: ${scope}).`;
      },
    },

    // -------------------------------------------------------------------------
    // download_subtitles: download subtitle files
    // -------------------------------------------------------------------------
    {
      name: "download_subtitles",
      description: "Download subtitle files for movies or TV shows.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
        language: z
          .string()
          .optional()
          .describe("ISO 639 language code (e.g. ita, eng). Uses tMM settings default if omitted."),
        onlyMissing: z
          .boolean()
          .default(true)
          .describe("Only download if no subtitle exists yet (default: true)"),
      }),
      async handler({
        type,
        scope,
        paths,
        language,
        onlyMissing,
      }: { type: MediaType; scope: string; paths?: string[]; language?: string; onlyMissing: boolean }) {
        const args: TmmCommand["args"] = { onlyMissing };
        if (language) args.language = language;
        const commands: TmmCommand[] = [{ action: "downloadSubtitle", scope: buildScope(scope, paths), args }];
        await client.send(type, commands);
        return `Subtitle download queued for ${type}s (scope: ${scope}${language ? `, language: ${language}` : ""}, onlyMissing: ${onlyMissing}).`;
      },
    },

    // -------------------------------------------------------------------------
    // download_artwork: download missing posters, fanart, etc.
    // -------------------------------------------------------------------------
    {
      name: "download_artwork",
      description: "Download missing artwork (posters, fanart, banners) for movies or TV shows.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
      }),
      async handler({ type, scope, paths }: { type: MediaType; scope: string; paths?: string[] }) {
        const commands: TmmCommand[] = [{ action: "downloadMissingArtwork", scope: buildScope(scope, paths) }];
        await client.send(type, commands);
        return `Artwork download queued for ${type}s (scope: ${scope}).`;
      },
    },

    // -------------------------------------------------------------------------
    // download_trailers: download movie/show trailers
    // -------------------------------------------------------------------------
    {
      name: "download_trailers",
      description: "Download trailers for movies or TV shows.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
        onlyMissing: z.boolean().default(true).describe("Only download if no trailer exists yet (default: true)"),
      }),
      async handler({
        type,
        scope,
        paths,
        onlyMissing,
      }: { type: MediaType; scope: string; paths?: string[]; onlyMissing: boolean }) {
        const commands: TmmCommand[] = [
          { action: "downloadTrailer", scope: buildScope(scope, paths), args: { onlyMissing } },
        ];
        await client.send(type, commands);
        return `Trailer download queued for ${type}s (scope: ${scope}, onlyMissing: ${onlyMissing}).`;
      },
    },

    // -------------------------------------------------------------------------
    // fetch_ratings: refresh ratings from online sources
    // -------------------------------------------------------------------------
    {
      name: "fetch_ratings",
      description: "Refresh ratings data from online sources for movies or TV shows.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
      }),
      async handler({ type, scope, paths }: { type: MediaType; scope: string; paths?: string[] }) {
        const commands: TmmCommand[] = [{ action: "fetchRatings", scope: buildScope(scope, paths) }];
        await client.send(type, commands);
        return `Rating refresh queued for ${type}s (scope: ${scope}).`;
      },
    },

    // -------------------------------------------------------------------------
    // reload_media_info: re-read technical metadata from media files (v5.0.10+)
    // -------------------------------------------------------------------------
    {
      name: "reload_media_info",
      description: "Reload technical media information (codec, resolution, audio) from files. Requires tMM v5.0.10+.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
      }),
      async handler({ type, scope, paths }: { type: MediaType; scope: string; paths?: string[] }) {
        const commands: TmmCommand[] = [{ action: "reloadMediaInfo", scope: buildScope(scope, paths) }];
        await client.send(type, commands);
        return `Media info reload queued for ${type}s (scope: ${scope}).`;
      },
    },

    // -------------------------------------------------------------------------
    // export_library: export library using a tMM export template
    // -------------------------------------------------------------------------
    {
      name: "export_library",
      description: "Export the media library using a tinyMediaManager export template.",
      inputSchema: z.object({
        type: mediaTypeSchema,
        scope: actionScopeSchema,
        paths: pathsSchema,
        template: z.string().describe("Export template name (e.g. ExcelXml, HtmlDetail, HtmlDefault)"),
        exportPath: z.string().describe("Destination directory for the export output"),
      }),
      async handler({
        type,
        scope,
        paths,
        template,
        exportPath,
      }: { type: MediaType; scope: string; paths?: string[]; template: string; exportPath: string }) {
        const commands: TmmCommand[] = [
          { action: "export", scope: buildScope(scope, paths), args: { template, exportPath } },
        ];
        await client.send(type, commands);
        return `Export queued for ${type}s to ${exportPath} using template ${template}.`;
      },
    },
  ] as const;
}
