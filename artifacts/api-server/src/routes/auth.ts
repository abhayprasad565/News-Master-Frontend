import { Router, type IRouter } from "express";
import { createSessionCookie, SESSION_COOKIE } from "../lib/session";

const router: IRouter = Router();

const SECURE_COOKIE = process.env.WEB_COOKIE_SECURE === "true";

const ADMIN_EMAIL = process.env.WEB_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.WEB_ADMIN_PASSWORD ?? "admin-password";
const READER_EMAIL = process.env.WEB_READER_EMAIL ?? "reader@example.com";
const READER_PASSWORD = process.env.WEB_READER_PASSWORD ?? "reader-password";

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "email and password are required", requestId: req.id });
    return;
  }

  let role: "admin" | "reader" | null = null;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    role = "admin";
  } else if (email === READER_EMAIL && password === READER_PASSWORD) {
    role = "reader";
  }

  if (!role) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password", requestId: req.id });
    return;
  }

  const cookieValue = createSessionCookie({ email, role });
  res.cookie(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE_COOKIE,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
  });

  res.json({ user: { email, role } });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: SECURE_COOKIE });
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session ?? null;
  res.json({ user: session ? { email: session.email, role: session.role } : null });
});

export default router;
