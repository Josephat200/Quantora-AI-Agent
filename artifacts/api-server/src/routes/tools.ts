import { Router, type IRouter } from "express";
import { calculate, listTools } from "../services/tools";

const router: IRouter = Router();

router.get("/v1/tools", (_req, res) => res.json(listTools()));
router.post("/v1/tools/calculator", (req, res) => {
  try {
    const expression = typeof req.body?.expression === "string" ? req.body.expression : "";
    res.json({ expression, result: calculate(expression) });
  } catch (error) {
    res.status(422).json({ success: false, error: { code: "INVALID_EXPRESSION", message: error instanceof Error ? error.message : "Invalid expression." } });
  }
});

export default router;