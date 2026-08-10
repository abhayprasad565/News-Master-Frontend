import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storiesRouter from "./stories";
import adminLabelsRouter from "./admin-labels";
import adminPostsRouter from "./admin-posts";
import reviewRouter from "./review";
import eventsRouter from "./events";
import auditRouter from "./audit";
import publicationsRouter from "./publications";
import platformPostsRouter from "./platform-posts";
import metricsRouter from "./metrics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storiesRouter);
router.use(adminLabelsRouter);
router.use(adminPostsRouter);
router.use(reviewRouter);
router.use(eventsRouter);
router.use(auditRouter);
router.use(publicationsRouter);
router.use(platformPostsRouter);
router.use(metricsRouter);

export default router;
