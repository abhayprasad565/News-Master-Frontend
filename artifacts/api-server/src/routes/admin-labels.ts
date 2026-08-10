import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  visibility: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for demo
let labels: Label[] = [
  { id: "label-1", name: "Breaking News", slug: "breaking-news", description: "Urgent developing stories", color: "#dc2626", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-2", name: "Politics", slug: "politics", description: "Government and policy", color: "#2563eb", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-3", name: "Technology", slug: "technology", description: "Tech and science news", color: "#7c3aed", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-4", name: "Business", slug: "business", description: "Economy and markets", color: "#059669", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-5", name: "Internal", slug: "internal", description: "Admin-only label", color: "#6b7280", visibility: "ADMIN_ONLY", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let nextId = 6;

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

router.get("/admin/labels", requireAdmin, async (_req, res): Promise<void> => {
  res.json({ items: labels });
});

router.post("/admin/labels", requireAdmin, async (req, res): Promise<void> => {
  const { name, slug, description, color, visibility } = req.body as Record<string, string | undefined>;
  if (!name) {
    res.status(400).json({ error: "validation_error", message: "name is required", requestId: req.id });
    return;
  }
  const newLabel: Label = {
    id: `label-${nextId++}`,
    name,
    slug: slug ?? slugify(name),
    description: description ?? null,
    color: color ?? "#2563eb",
    visibility: visibility ?? "PUBLIC",
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  labels.push(newLabel);
  res.status(201).json(newLabel);
});

router.patch("/admin/labels/:labelId", requireAdmin, async (req, res): Promise<void> => {
  const { labelId } = req.params as { labelId: string };
  const idx = labels.findIndex(l => l.id === labelId);
  if (idx === -1) {
    res.status(404).json({ error: "not_found", message: "Label not found", requestId: req.id });
    return;
  }
  const update = req.body as Partial<Label>;
  labels[idx] = { ...labels[idx], ...update, updatedAt: new Date().toISOString() };
  res.json(labels[idx]);
});

router.delete("/admin/labels/:labelId", requireAdmin, async (req, res): Promise<void> => {
  const { labelId } = req.params as { labelId: string };
  const idx = labels.findIndex(l => l.id === labelId);
  if (idx === -1) {
    res.status(404).json({ error: "not_found", message: "Label not found", requestId: req.id });
    return;
  }
  labels[idx] = { ...labels[idx], archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  res.json({ ok: true });
});

export default router;
