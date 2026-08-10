import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const jobs = [
  { id: "job-1", version: 1, status: "PENDING_REVIEW", postId: "post-2", eventId: "event-2", payload: null, createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), updatedAt: null },
  { id: "job-2", version: 2, status: "PENDING_REVIEW", postId: null, eventId: "event-5", payload: null, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), updatedAt: null },
];

function handleJobAction(jobId: string, body: Record<string, unknown>, req: import("express").Request, res: import("express").Response): void {
  const job = jobs.find(j => j.id === jobId);
  if (!job) { res.status(404).json({ error: "not_found", message: "Job not found", requestId: req.id }); return; }
  const { reason, expectedVersion } = body;
  if (!reason || typeof reason !== "string") {
    res.status(400).json({ error: "validation_error", message: "reason is required", requestId: req.id }); return;
  }
  if (expectedVersion == null) {
    res.status(400).json({ error: "validation_error", message: "expectedVersion is required", requestId: req.id }); return;
  }
  if (Number(expectedVersion) !== job.version) {
    res.status(409).json({ error: "conflict", message: "Version conflict — job was updated since you last loaded it", requestId: req.id }); return;
  }
  res.json({ ok: true });
}

router.get("/review", requireAdmin, async (_req, res): Promise<void> => {
  res.json({ items: jobs, nextCursor: null });
});

router.post("/review/jobs/:jobId/approve", requireAdmin, async (req, res): Promise<void> => {
  handleJobAction(req.params.jobId as string, req.body as Record<string, unknown>, req, res);
});
router.post("/review/jobs/:jobId/reject", requireAdmin, async (req, res): Promise<void> => {
  handleJobAction(req.params.jobId as string, req.body as Record<string, unknown>, req, res);
});
router.post("/review/jobs/:jobId/requeue", requireAdmin, async (req, res): Promise<void> => {
  handleJobAction(req.params.jobId as string, req.body as Record<string, unknown>, req, res);
});
router.post("/review/jobs/:jobId/request-correction", requireAdmin, async (req, res): Promise<void> => {
  handleJobAction(req.params.jobId as string, req.body as Record<string, unknown>, req, res);
});

export default router;
