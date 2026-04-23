export type MediaType = "movie" | "tvshow";

export type UpdateScope = "all" | "single" | "path" | "show";
export type ActionScope = "all" | "new" | "unscraped" | "path" | "dataSource" | "single";

export interface ScopeObject {
  name: string;
  args?: (string | number)[];
}

export interface CommandArgs {
  scraper?: string;
  onlyMissing?: boolean;
  language?: string;
  template?: string;
  exportPath?: string;
}

export interface TmmCommand {
  action: string;
  scope: ScopeObject;
  args?: CommandArgs;
}

export interface TmmConfig {
  host: string;
  port: number;
  apiKey: string;
}
