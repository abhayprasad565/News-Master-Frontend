import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const platformPosts = [
  { id: "pp-1", postId: "post-1", publicationId: "pub-1", deliveryId: "del-1", attemptId: "attempt-1", platform: "x", destination: "main-account", remoteId: "tweet-123", content: "Stock markets surged after the Federal Reserve signaled a pause in interest rate hikes. #markets #fed", mediaUrl: null, requestPayload: null, responsePayload: null, publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(), createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "pp-2", postId: "post-1", publicationId: "pub-1", deliveryId: "del-2", attemptId: "attempt-2", platform: "instagram", destination: "main-account", remoteId: null, content: "Breaking: Stock markets rally after Federal Reserve rate decision. Follow for updates.", mediaUrl: "https://via.placeholder.com/1080x1080", requestPayload: null, responsePayload: null, publishedAt: null, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
];

router.get("/admin/platform-posts", requireAdmin, async (req, res): Promise<void> => {
  const { platform } = req.query as Record<string, string | undefined>;
  let items = [...platformPosts];
  if (platform) items = items.filter(p => p.platform === platform);
  res.json({ items, nextCursor: null });
});

router.get("/admin/platform-posts/:platformPostId", requireAdmin, async (req, res): Promise<void> => {
  const { platformPostId } = req.params as { platformPostId: string };
  const pp = platformPosts.find(p => p.id === platformPostId);
  if (!pp) { res.status(404).json({ error: "not_found", message: "Platform post not found", requestId: req.id }); return; }
  res.json({ platformPost: pp, post: null, publication: null, delivery: null });
});

export default router;
