import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

type PostStatus = "DRAFT" | "VALIDATING" | "VALIDATED" | "MANUAL_REVIEW" | "REJECTED" | "PUBLISHED";
type PostKind = "ORIGINAL" | "CORRECTION" | "CUSTOM";

interface Post {
  id: string;
  eventId: string | null;
  kind: PostKind;
  status: PostStatus;
  title: string | null;
  text: string;
  labels: Array<{ id: string; name: string; slug: string; color: string; visibility: string }>;
  validationReason: string | null;
  correctionOfPostId: string | null;
  replacementFactIds: string[] | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

let posts: Post[] = [
  { id: "post-1", eventId: "event-1", kind: "ORIGINAL", status: "PUBLISHED", title: "Global Markets Rally After Fed Decision", text: "Stock markets around the world surged after the Federal Reserve signaled a pause in interest rate hikes.", labels: [{ id: "label-2", name: "Politics", slug: "politics", color: "#2563eb", visibility: "PUBLIC" }], validationReason: null, correctionOfPostId: null, replacementFactIds: null, createdBy: "system", updatedBy: null, createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(), archivedAt: null },
  { id: "post-2", eventId: "event-2", kind: "ORIGINAL", status: "MANUAL_REVIEW", title: "New Climate Agreement Reached", text: "Representatives from 140 nations signed a landmark climate agreement.", labels: [{ id: "label-1", name: "Breaking News", slug: "breaking-news", color: "#dc2626", visibility: "PUBLIC" }], validationReason: "Pending fact check on emission figures", correctionOfPostId: null, replacementFactIds: null, createdBy: "system", updatedBy: null, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), publishedAt: null, archivedAt: null },
  { id: "post-3", eventId: null, kind: "CUSTOM", status: "DRAFT", title: "Draft: Upcoming Press Conference", text: "Coverage of tomorrow's scheduled press conference.", labels: [], validationReason: null, correctionOfPostId: null, replacementFactIds: null, createdBy: "admin@example.com", updatedBy: null, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), publishedAt: null, archivedAt: null },
  { id: "post-4", eventId: "event-3", kind: "ORIGINAL", status: "VALIDATED", title: "Tech Giant Reports Record Earnings", text: "Record quarterly revenue of $98 billion, beating estimates by 12%.", labels: [{ id: "label-3", name: "Technology", slug: "technology", color: "#7c3aed", visibility: "PUBLIC" }], validationReason: null, correctionOfPostId: null, replacementFactIds: null, createdBy: "system", updatedBy: null, createdAt: new Date(Date.now() - 10 * 3600000).toISOString(), publishedAt: null, archivedAt: null },
  { id: "post-5", eventId: "event-4", kind: "ORIGINAL", status: "REJECTED", title: "Unverified Report: Major Breach", text: "Unconfirmed reports of a cybersecurity incident at a major financial institution.", labels: [], validationReason: "Insufficient sourcing — requires at least two independent confirmations", correctionOfPostId: null, replacementFactIds: null, createdBy: "system", updatedBy: null, createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), publishedAt: null, archivedAt: null },
];

let nextPostId = 6;

const MUTABLE_STATUSES: PostStatus[] = ["DRAFT", "MANUAL_REVIEW", "REJECTED", "VALIDATED"];

router.get("/admin/posts", requireAdmin, async (req, res): Promise<void> => {
  const { status, kind, includeArchived } = req.query as Record<string, string | undefined>;
  let items = [...posts];
  if (status) items = items.filter(p => p.status === status);
  if (kind) items = items.filter(p => p.kind === kind);
  if (includeArchived !== "true") items = items.filter(p => !p.archivedAt);
  res.json({ items, nextCursor: null });
});

router.post("/admin/posts", requireAdmin, async (req, res): Promise<void> => {
  const { text, title, eventId, labelIds } = req.body as Record<string, unknown>;
  if (text == null || typeof text !== "string") {
    res.status(400).json({ error: "validation_error", message: "text is required", requestId: req.id });
    return;
  }
  const newPost: Post = {
    id: `post-${nextPostId++}`, eventId: (eventId as string | null) ?? null, kind: "CUSTOM", status: "DRAFT",
    title: (title as string | null) ?? null, text,
    labels: [], validationReason: null, correctionOfPostId: null, replacementFactIds: null,
    createdBy: req.session?.email ?? null, updatedBy: null,
    createdAt: new Date().toISOString(), publishedAt: null, archivedAt: null,
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

router.get("/admin/posts/:postId", requireAdmin, async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const post = posts.find(p => p.id === postId);
  if (!post) { res.status(404).json({ error: "not_found", message: "Post not found", requestId: req.id }); return; }
  res.json(post);
});

router.patch("/admin/posts/:postId", requireAdmin, async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) { res.status(404).json({ error: "not_found", message: "Post not found", requestId: req.id }); return; }
  if (!MUTABLE_STATUSES.includes(posts[idx].status)) {
    res.status(409).json({ error: "conflict", message: "Post is not editable in its current status", requestId: req.id }); return;
  }
  const { text, title, eventId, labelIds: _labelIds } = req.body as Record<string, unknown>;
  posts[idx] = { ...posts[idx], ...(text !== undefined ? { text: text as string } : {}), ...(title !== undefined ? { title: title as string | null } : {}), ...(eventId !== undefined ? { eventId: eventId as string | null } : {}), updatedBy: req.session?.email ?? null };
  res.json(posts[idx]);
});

router.delete("/admin/posts/:postId", requireAdmin, async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) { res.status(404).json({ error: "not_found", message: "Post not found", requestId: req.id }); return; }
  if (posts[idx].status === "PUBLISHED") {
    res.status(409).json({ error: "conflict", message: "Cannot archive a published post", requestId: req.id }); return;
  }
  posts[idx] = { ...posts[idx], archivedAt: new Date().toISOString() };
  res.json({ ok: true });
});

router.post("/admin/posts/:postId/publish", requireAdmin, async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) { res.status(404).json({ error: "not_found", message: "Post not found", requestId: req.id }); return; }
  if (posts[idx].status === "PUBLISHED") {
    res.status(409).json({ error: "conflict", message: "Post is already published", requestId: req.id }); return;
  }
  const { destinations } = req.body as { destinations?: unknown[] };
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    res.status(400).json({ error: "validation_error", message: "At least one destination is required", requestId: req.id }); return;
  }
  posts[idx] = { ...posts[idx], status: "PUBLISHED", publishedAt: new Date().toISOString() };
  res.json({ ok: true });
});

router.post("/admin/posts/:postId/corrections", requireAdmin, async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const source = posts.find(p => p.id === postId);
  if (!source) { res.status(404).json({ error: "not_found", message: "Post not found", requestId: req.id }); return; }
  if (source.status !== "PUBLISHED") {
    res.status(409).json({ error: "conflict", message: "Source post must be published", requestId: req.id }); return;
  }
  const { text, title, labelIds: _labelIds } = req.body as Record<string, unknown>;
  if (text == null || typeof text !== "string") {
    res.status(400).json({ error: "validation_error", message: "text is required", requestId: req.id }); return;
  }
  const correction: Post = {
    id: `post-${nextPostId++}`, eventId: source.eventId, kind: "CORRECTION", status: "DRAFT",
    title: (title as string | null) ?? null, text, labels: [],
    validationReason: null, correctionOfPostId: postId, replacementFactIds: null,
    createdBy: req.session?.email ?? null, updatedBy: null,
    createdAt: new Date().toISOString(), publishedAt: null, archivedAt: null,
  };
  posts.push(correction);
  res.status(201).json(correction);
});

export default router;
