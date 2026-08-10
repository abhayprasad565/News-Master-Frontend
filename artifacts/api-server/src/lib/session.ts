import crypto from "crypto";

const SESSION_COOKIE = "news_master_session";
const SESSION_SECRET =
  process.env.WEB_SESSION_SECRET ||
  process.env.SESSION_SECRET ||
  "dev-session-secret-change-me";

export type SessionRole = "admin" | "reader";

export interface SessionData {
  email: string;
  role: SessionRole;
}

function sign(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createSessionCookie(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = sign(payload, SESSION_SECRET);
  return `${payload}.${sig}`;
}

export function parseSessionCookie(cookie: string): SessionData | null {
  const parts = cookie.split(".");
  if (parts.length < 2) return null;
  const sig = parts.pop()!;
  const payload = parts.join(".");
  const expected = sign(payload, SESSION_SECRET);
  if (sig !== expected) return null;
  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionData;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(
  cookies: Record<string, string>,
): SessionData | null {
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;
  return parseSessionCookie(raw);
}

export { SESSION_COOKIE };
