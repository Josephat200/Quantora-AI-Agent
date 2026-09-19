import { Router, type IRouter } from "express";
import { settings } from "../lib/settings";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", service: settings.appName, version: settings.appVersion });
});

router.get("/v1/health", (_req, res) => {
  res.json({ status: "healthy", service: settings.appName, version: settings.appVersion });
});

router.get("/v1/health/ready", (_req, res) => {
  res.json({ status: "ready", service: settings.appName, database: "not_configured" });
});

export default router;
