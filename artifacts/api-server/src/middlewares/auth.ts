import { type Request, type Response, type NextFunction } from "express";
import { getSessionFromRequest, type SessionRole } from "../lib/session";

// Extend Express request type
declare global {
  namespace Express {
    interface Request {
      session?: { email: string; role: SessionRole } | null;
    }
  }
}

export function sessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.session = getSessionFromRequest(req.cookies || {});
  next();
}

export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required", requestId: req.id });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required", requestId: req.id });
    return;
  }
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Admin access required", requestId: req.id });
    return;
  }
  next();
}
