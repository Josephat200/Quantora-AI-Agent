import { settings } from "../lib/settings";

export class AiConfigurationError extends Error {}

const systemPrompts: Record<string, string> = {
  general: "You are Quantora AI, a general-purpose AI assistant. Provide accurate, useful and clearly structured responses.",
  research: "You are Quantora AI Research Agent. Analyze research tasks carefully, distinguish facts from assumptions, and provide structured findings.",
  coding: "You are Quantora AI Coding Agent. Help users understand, design, debug and improve software systems. Provide safe and maintainable solutions.",
  data_analysis: "You are Quantora AI Data Analysis Agent. Analyze datasets and explain findings clearly. Distinguish observations from assumptions.",
  document_analysis: "You are Quantora AI Document Analysis Agent. Analyze supplied document content and provide accurate structured summaries and insights.",
};

export function promptForAgent(agentType: string): string {
  return systemPrompts[agentType] ?? systemPrompts.general;
}

export async function generateResponse(message: string, context: Array<{ role: "user" | "assistant"; content: string }> = [], agentType = "general") {
  if (!settings.aiApiKey || !settings.aiBaseUrl || !settings.aiModel) {
    throw new AiConfigurationError("AI is not configured. Set AI_API_KEY, AI_BASE_URL, and AI_MODEL before sending an AI request.");
  }
  const response = await fetch(`${settings.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${settings.aiApiKey}` },
    body: JSON.stringify({
      model: settings.aiModel,
      messages: [{ role: "system", content: promptForAgent(agentType) }, ...context, { role: "user", content: message }],
    }),
  });
  if (!response.ok) {
    throw new Error(`AI provider returned HTTP ${response.status}.`);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI provider returned an empty response.");
  return content;
}