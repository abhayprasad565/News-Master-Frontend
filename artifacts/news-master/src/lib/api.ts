export class FrontendApiError extends Error {
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "FrontendApiError";
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  responseType?: "json" | "text";
  csrf?: boolean | string;
};

const CSRF_STORAGE_KEY = "scrollbrief.csrf";

export function setCsrfToken(token: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  else sessionStorage.removeItem(CSRF_STORAGE_KEY);
}

async function csrfToken(forceFresh = false): Promise<string> {
  if (typeof sessionStorage !== "undefined" && !forceFresh) {
    const cached = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (cached) return cached;
  }
  setCsrfToken(null);
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  if (!response.ok)
    throw new FrontendApiError("Authentication required", response.status);
  const data = (await response.json()) as { csrfToken: string };
  setCsrfToken(data.csrfToken);
  return data.csrfToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { responseType = "json", csrf = true, headers, ...init } = options;
  const hasFormDataBody =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const method = (init.method ?? "GET").toUpperCase();
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
  const requestHeaders = new Headers(headers);
  let requestBody = init.body;
  if (mutating && !hasFormDataBody) {
    if (requestBody === undefined || requestBody === null) {
      requestBody = "{}";
    }
    if (!requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json");
    }
  }
  if (mutating && csrf) {
    requestHeaders.set(
      "x-csrf-token",
      typeof csrf === "string" ? csrf : await csrfToken(),
    );
  }
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    body: requestBody,
    headers: requestHeaders,
  });

  const text = await response.text();
  const data = text ? parseBody(text) : null;

  if (!response.ok) {
    const body =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    if (
      response.status === 403 &&
      body.error === "CSRF_REJECTED" &&
      mutating &&
      csrf
    ) {
      const freshToken = await csrfToken(true);
      requestHeaders.set("x-csrf-token", freshToken);
      const retryResponse = await fetch(path, {
        credentials: "include",
        ...init,
        body: requestBody,
        headers: requestHeaders,
      });
      const retryText = await retryResponse.text();
      const retryData = retryText ? parseBody(retryText) : null;
      if (retryResponse.ok) {
        return (responseType === "text" ? retryText : retryData) as T;
      }
      const retryBody =
        retryData && typeof retryData === "object"
          ? (retryData as Record<string, unknown>)
          : {};
      throw new FrontendApiError(
        String(
          retryBody.message ||
            retryBody.error ||
            retryResponse.statusText ||
            "Request failed",
        ),
        retryResponse.status,
        typeof retryBody.requestId === "string"
          ? retryBody.requestId
          : undefined,
        retryBody.details,
      );
    }
    throw new FrontendApiError(
      String(
        body.message || body.error || response.statusText || "Request failed",
      ),
      response.status,
      typeof body.requestId === "string" ? body.requestId : undefined,
      body.details,
    );
  }

  return (responseType === "text" ? text : data) as T;
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function toQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const stringified = query.toString();
  return stringified ? `?${stringified}` : "";
}
