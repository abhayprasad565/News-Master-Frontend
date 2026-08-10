import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/metrics", requireAdmin, async (_req, res): Promise<void> => {
  res.json({
    prometheus: `# HELP news_master_posts_total Total posts by status\n# TYPE news_master_posts_total gauge\nnews_master_posts_total{status="DRAFT"} 1\nnews_master_posts_total{status="MANUAL_REVIEW"} 1\nnews_master_posts_total{status="VALIDATED"} 1\nnews_master_posts_total{status="REJECTED"} 1\nnews_master_posts_total{status="PUBLISHED"} 1\n`,
  });
});

export default router;
