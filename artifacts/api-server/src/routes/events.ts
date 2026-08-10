import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const eventData: Record<string, object> = {
  "event-1": { id: "event-1", title: "Federal Reserve Rate Decision", summary: "Fed signals pause on rate hikes" },
  "event-2": { id: "event-2", title: "UN Climate Summit", summary: "Nations reach landmark climate agreement" },
  "event-3": { id: "event-3", title: "Tech Earnings", summary: "Major tech company earnings release" },
};

router.get("/events/:eventId", requireAdmin, async (req, res): Promise<void> => {
  const { eventId } = req.params as { eventId: string };
  const event = eventData[eventId] ?? { id: eventId };
  res.json({ event, claims: [], claimEvidence: [], facts: [], post: null, publication: null, deliveries: [] });
});

router.get("/editorial/events/:eventId/topics", requireAdmin, async (req, res): Promise<void> => {
  res.json({ items: [] });
});

router.put("/editorial/topics/:topicId/override", requireAdmin, async (req, res): Promise<void> => {
  res.json({ ok: true });
});

export default router;
