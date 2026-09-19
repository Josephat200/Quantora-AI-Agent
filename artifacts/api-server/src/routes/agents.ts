import { Router, type IRouter } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { generateResponse, AiConfigurationError, promptForAgent } from "../services/ai";

const router: IRouter = Router();
const agentTypes = ["general", "research", "coding", "data_analysis", "document_analysis"];

router.get("/v1/agents", (_req, res) => {
  res.json(agentTypes.map((type) => ({ type, system_prompt: promptForAgent(type) })));
});

router.post("/v1/agents/run", requireAuth, async (req: AuthenticatedRequest, res) => {
  const task = typeof req.body?.task === "string" ? req.body.task.trim() : "";
  const agentType = typeof req.body?.agent_type === "string" ? req.body.agent_type : "general";
  if (!task || !agentTypes.includes(agentType)) {
    res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Provide a task and a supported agent_type." } });
    return;
  }
  try {
    res.json({ task, agent_type: agentType, result: await generateResponse(task, [], agentType) });
  } catch (error) {
    const status = error instanceof AiConfigurationError ? 503 : 502;
    res.status(status).json({ success: false, error: { code: error instanceof AiConfigurationError ? "AI_NOT_CONFIGURED" : "AI_SERVICE_ERROR", message: error instanceof Error ? error.message : "The AI service is unavailable." } });
  }
});

export default router;