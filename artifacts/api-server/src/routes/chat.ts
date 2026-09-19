import { Router, type IRouter } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { conversations, newId } from "../lib/stores";
import { generateResponse, AiConfigurationError } from "../services/ai";
import type { Conversation } from "../types";

const router: IRouter = Router();
const toPublicMessage = (message: { id: string; role: string; content: string; createdAt: string }) => ({ id: message.id, role: message.role, content: message.content, created_at: message.createdAt });
const toPublicConversation = (conversation: Conversation) => ({ id: conversation.id, title: conversation.title, updated_at: conversation.updatedAt, messages: conversation.messages.map(toPublicMessage) });

router.post("/v1/chat", requireAuth, async (req: AuthenticatedRequest, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message is required." } });
    return;
  }
  const now = new Date().toISOString();
  const existing = typeof req.body?.conversation_id === "string" ? conversations.get(req.body.conversation_id) : undefined;
  const conversation: Conversation = existing?.userId === req.user!.id ? existing : { id: newId(), userId: req.user!.id, title: message.slice(0, 60), messages: [], updatedAt: now };
  const userMessage = { id: newId(), role: "user" as const, content: message, createdAt: now };
  conversation.messages.push(userMessage);
  try {
    const answer = await generateResponse(message, conversation.messages.slice(-10, -1).map(({ role, content }) => ({ role, content })));
    conversation.messages.push({ id: newId(), role: "assistant", content: answer, createdAt: new Date().toISOString() });
    conversation.updatedAt = new Date().toISOString();
    conversations.set(conversation.id, conversation);
    res.json({ message: answer, conversation_id: conversation.id, model: process.env.AI_MODEL ?? "" });
  } catch (error) {
    conversation.messages.pop();
    if (error instanceof AiConfigurationError) {
      res.status(503).json({ success: false, error: { code: "AI_NOT_CONFIGURED", message: error.message } });
      return;
    }
    res.status(502).json({ success: false, error: { code: "AI_SERVICE_ERROR", message: error instanceof Error ? error.message : "The AI service is unavailable." } });
  }
});

router.get("/v1/chat/conversations", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json([...conversations.values()].filter((conversation) => conversation.userId === req.user!.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toPublicConversation));
});

router.get("/v1/chat/conversations/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const conversation = conversations.get(id);
  if (!conversation || conversation.userId !== req.user!.id) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found." } });
    return;
  }
  res.json(toPublicConversation(conversation));
});

router.delete("/v1/chat/conversations/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  const id = String(req.params.id);
  const conversation = conversations.get(id);
  if (!conversation || conversation.userId !== req.user!.id) {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Conversation not found." } });
    return;
  }
  conversations.delete(id);
  res.status(204).send();
});

export default router;