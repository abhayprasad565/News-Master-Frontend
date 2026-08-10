import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const publications = [
  { id: "pub-1", postId: "post-1", revision: 1, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
];

const deliveries = [
  { id: "del-1", publicationId: "pub-1", platform: "x", destination: "main-account", idempotencyKey: "key-1", status: "SENT", attemptCount: 1, lastError: null, sentAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "del-2", publicationId: "pub-1", platform: "instagram", destination: "main-account", idempotencyKey: "key-2", status: "FAILED", attemptCount: 3, lastError: "Rate limit exceeded", sentAt: null },
  { id: "del-3", publicationId: "pub-1", platform: "telegram", destination: "news-channel", idempotencyKey: "key-3", status: "UNKNOWN", attemptCount: 1, lastError: "No response from server", sentAt: null },
];

router.get("/admin/publications", requireAdmin, async (_req, res): Promise<void> => {
  res.json({ items: publications, nextCursor: null });
});

router.get("/admin/publications/:publicationId", requireAdmin, async (req, res): Promise<void> => {
  const { publicationId } = req.params as { publicationId: string };
  const pub = publications.find(p => p.id === publicationId);
  if (!pub) { res.status(404).json({ error: "not_found", message: "Publication not found", requestId: req.id }); return; }
  const pubDeliveries = deliveries.filter(d => d.publicationId === publicationId);
  res.json({ publication: pub, post: null, deliveries: pubDeliveries });
});

router.get("/admin/deliveries", requireAdmin, async (req, res): Promise<void> => {
  const { status, platform } = req.query as Record<string, string | undefined>;
  let items = [...deliveries];
  if (status) items = items.filter(d => d.status === status);
  if (platform) items = items.filter(d => d.platform === platform);
  res.json({ items, nextCursor: null });
});

router.get("/admin/deliveries/:deliveryId", requireAdmin, async (req, res): Promise<void> => {
  const { deliveryId } = req.params as { deliveryId: string };
  const delivery = deliveries.find(d => d.id === deliveryId);
  if (!delivery) { res.status(404).json({ error: "not_found", message: "Delivery not found", requestId: req.id }); return; }
  const pub = publications.find(p => p.id === delivery.publicationId);
  const attempts = [
    { id: `attempt-1`, deliveryId, attemptNumber: 1, outcome: delivery.status === "SENT" ? "SUCCESS" : "FAILED", remoteId: delivery.status === "SENT" ? "remote-123" : null, statusCode: delivery.status === "SENT" ? 200 : 429, errorMessage: delivery.status === "SENT" ? null : delivery.lastError, requestPayload: null, responsePayload: null, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  ];
  res.json({ delivery, publication: pub ?? null, post: null, attempts });
});

router.post("/admin/deliveries/:deliveryId/retry", requireAdmin, async (req, res): Promise<void> => {
  const { deliveryId } = req.params as { deliveryId: string };
  const delivery = deliveries.find(d => d.id === deliveryId);
  if (!delivery) { res.status(404).json({ error: "not_found", message: "Delivery not found", requestId: req.id }); return; }
  if (!["FAILED", "RETRY"].includes(delivery.status)) {
    res.status(409).json({ error: "conflict", message: "Can only retry FAILED or RETRY deliveries", requestId: req.id }); return;
  }
  res.json({ ok: true });
});

router.post("/admin/deliveries/:deliveryId/reconcile", requireAdmin, async (req, res): Promise<void> => {
  const { deliveryId } = req.params as { deliveryId: string };
  const delivery = deliveries.find(d => d.id === deliveryId);
  if (!delivery) { res.status(404).json({ error: "not_found", message: "Delivery not found", requestId: req.id }); return; }
  if (delivery.status !== "UNKNOWN") {
    res.status(409).json({ error: "conflict", message: "Can only reconcile UNKNOWN deliveries", requestId: req.id }); return;
  }
  const { outcome } = req.body as { outcome?: string };
  if (!outcome || !["SENT", "NOT_SENT", "FAILED"].includes(outcome)) {
    res.status(400).json({ error: "validation_error", message: "outcome must be SENT, NOT_SENT, or FAILED", requestId: req.id }); return;
  }
  res.json({ ok: true });
});

export default router;
