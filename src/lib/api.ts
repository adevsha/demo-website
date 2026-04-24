import { store } from "./state.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler): void {
  onUnauthorized = fn;
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    accept: "application/json",
    ...options.headers,
  };

  const token = store.getToken();
  if (token) headers["authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }

  const url = path.startsWith("/api") ? path : `/api${path}`;
  const response = await fetch(url, { method, headers, body });

  if (response.status === 401) {
    store.clearToken();
    onUnauthorized?.();
    throw new ApiError(401, null, "Unauthorized");
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    let detail: string | null = null;
    if (parsed && typeof parsed === "object" && "detail" in parsed) {
      const raw = (parsed as { detail: unknown }).detail;
      if (raw != null) detail = String(raw);
    }
    const message =
      detail || response.statusText || `HTTP ${response.status}`;
    throw new ApiError(response.status, parsed, message);
  }

  return parsed as T;
}
