import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/audit/:entityType/:entityId", requireAdmin, async (req, res): Promise<void> => {
  const { entityType, entityId } = req.params as { entityType: string; entityId: string };
  const items = [
    { id: `audit-1-${entityId}`, entityType, entityId, action: "CREATED", actor: "system", payload: null, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
    { id: `audit-2-${entityId}`, entityType, entityId, action: "STATUS_CHANGED", actor: "admin@example.com", payload: null, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  ];
  res.json({ items, nextCursor: null });
});

export default router;
