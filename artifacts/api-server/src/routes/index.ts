import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatRouter from "./chat";
import agentRouter from "./agents";
import fileRouter from "./files";
import toolRouter from "./tools";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(agentRouter);
router.use(fileRouter);
router.use(toolRouter);

export default router;
