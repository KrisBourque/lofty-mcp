export const LOFTY_BASE_URL = "https://api.lofty.com";

export interface LoftyConfig {
  apiKey: string;
  safeMode: boolean;
}

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, config: LoftyConfig) => Promise<string>;
};

export function getConfig(): LoftyConfig {
  const apiKey = process.env.LOFTY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LOFTY_API_KEY is not set. Add it to your MCP server environment config. " +
      "Use a Lofty OAuth2 access token or API key."
    );
  }
  if (/^(YOUR_KEY_HERE|your_api_key_here|placeholder|changeme)$/i.test(apiKey)) {
    throw new Error(
      `LOFTY_API_KEY is set to a placeholder value ("${apiKey}"). Set it to a real Lofty bearer token.`
    );
  }
  return {
    apiKey,
    safeMode: process.env.LOFTY_SAFE_MODE !== "false",
  };
}

function buildHeaders(config: LoftyConfig): Record<string, string> {
  // Lofty auth schemes differ by credential type (per https://developer.lofty.com/authentication):
  //   API Key       -> "Authorization: token <api_key>"
  //   OAuth token   -> "Authorization: Bearer <access_token>"
  // Configurable via LOFTY_AUTH_SCHEME; defaults to Bearer for backward compatibility.
  const scheme = process.env.LOFTY_AUTH_SCHEME || "Bearer";
  return {
    Authorization: `${scheme} ${config.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export class LoftyApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
    public endpoint: string
  ) {
    super(`Lofty API Error ${status} on ${endpoint}: ${statusText}`);
    this.name = "LoftyApiError";
  }
}

export async function loftyRequest<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: {
    config: LoftyConfig;
    params?: Record<string, unknown>;
    body?: unknown;
  }
): Promise<T> {
  const { config, params, body } = options;
  const maxRetries = 3;

  let url = `${LOFTY_BASE_URL}${path}`;
  if (params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(config),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "2", 10);
      const wait = Math.min(retryAfter * 1000, 10000) * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      let errorBody: unknown;
      try { errorBody = JSON.parse(text); } catch { errorBody = text; }
      throw new LoftyApiError(response.status, response.statusText, errorBody, path);
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  throw new Error("Max retries exceeded");
}

export function formatError(error: unknown): string {
  if (error instanceof LoftyApiError) {
    const out: Record<string, unknown> = {
      error: true,
      status: error.status,
      endpoint: error.endpoint,
      message: error.message,
      details: error.body,
    };
    // "User in token does not exist" (code 200058) almost always means an API Key
    // is being sent with the wrong auth scheme. API keys require "Authorization: token <key>",
    // not "Bearer". Surface an actionable hint instead of a cryptic error.
    const code = (error.body as { code?: number })?.code;
    if (code === 200058 && (process.env.LOFTY_AUTH_SCHEME || "Bearer") !== "token") {
      out.hint =
        "Authentication failed. If LOFTY_API_KEY is a Lofty API Key (from Settings -> API Keys), " +
        "set LOFTY_AUTH_SCHEME=token -- API keys must be sent as 'Authorization: token <key>', not 'Bearer'. " +
        "See https://developer.lofty.com/authentication";
    }
    return JSON.stringify(out, null, 2);
  }
  if (error instanceof Error) {
    return JSON.stringify({ error: true, message: error.message });
  }
  return JSON.stringify({ error: true, message: String(error) });
}

const META_PARAMS = new Set(["wait_for_previous", "_meta", "__mcp", "__progressToken"]);

export function stripMeta(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (!META_PARAMS.has(k)) out[k] = v;
  }
  return out;
}
