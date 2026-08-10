export class FrontendApiError extends Error {
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(message: string, status: number, requestId?: string, details?: unknown) {
    super(message);
    this.name = 'FrontendApiError';
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

type RequestOptions = RequestInit & {
  responseType?: 'json' | 'text';
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { responseType = 'json', headers, ...init } = options;
  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const data = text ? parseBody(text) : null;

  if (!response.ok) {
    const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    throw new FrontendApiError(
      String(body.message || body.error || response.statusText || 'Request failed'),
      response.status,
      typeof body.requestId === 'string' ? body.requestId : undefined,
      body.details,
    );
  }

  return (responseType === 'text' ? text : data) as T;
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const stringified = query.toString();
  return stringified ? `?${stringified}` : '';
}
