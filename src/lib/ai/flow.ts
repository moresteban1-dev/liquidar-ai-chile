import { z } from 'genkit';
import { ai } from '@infrastructure/ai/config';
import { negotiatorAgent } from '@infrastructure/ai/agents/NegotiatorAgent';
import { qaSentinelAgent } from '@infrastructure/ai/agents/QASentinelAgent';
 
// [REMOVED] t
import { logger } from '@/lib/logger';
import { executeAIFlow } from '@infrastructure/ai/services/ResilientGenkitService';
import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';

// Define schemas for strict typing (Supervisor Level)
const AgentInputSchema = z.object({
  messages: z.array(z.any()),
  orderId: z.string().optional(),
  data: z.any().optional(),
});

const AgentOutputSchema = z.object({
  response: z.string(),
  history: z.array(z.any()),
  next: z.string().optional(),
  actionTaken: z.any().optional(),
});

/**
 * Main Drop Service Supervisor Flow
 * Orchestrates specialized agents.
 */
export const dropServiceAgent = ai.defineFlow(
  {
    name: "dropServiceAgent",
    inputSchema: AgentInputSchema,
    outputSchema: AgentOutputSchema,
  },
  async (input: z.infer<typeof AgentInputSchema>) => {
    const { messages, data } = input;

    // 1. Supervisor Routing Decision
    const routingSchema = z.object({
      next: z.enum(["Negotiator", "QA", "User"]),
      reasoning: z.string()
    });

    const routingPrompt = PromptRegistry.get('SUPERVISOR_ROUTING', 'v1')({
      systemPrompt: "You are the Supervisor of a Drop - Servicing Platform.",
      data,
      lastMessage: messages[messages.length - 1].content
    });

    const routingResult = await executeAIFlow({
      name: 'SupervisorRouting',
      input: { messages, data },
      outputSchema: routingSchema,
      prompt: routingPrompt,
      model: 'fast',
      maxRetries: 3,
      useCache: false
    });

    if (!routingResult.success) {
      logger.error(`[Supervisor] Routing Failed: ${routingResult.error?.message} `);
      return {
        response: "Lo siento, estoy teniendo problemas para conectar con mi cerebro de IA. Por favor, intenta de nuevo.",
        history: messages,
        next: "User"
      };
    }

    const decision = routingResult.data;
    let responseContent = "";
     
    let actionTaken: any = null;

    logger.info(`[Supervisor] Routing to: ${decision.next} (${decision.reasoning})`);

    // 2. Dispatch to Sub-Agents
    if (decision.next === "Negotiator") {
      if (!data?.priceCost || !data?.serviceCategory) {
        responseContent = "Error: Missing priceCost or serviceCategory for negotiation.";
      } else {
        const negotiationResult = await negotiatorAgent.execute({
          priceCost: data.priceCost,
          serviceCategory: data.serviceCategory,
          providerId: data.providerId
        });
        responseContent = negotiationResult.replyToUser;
        actionTaken = negotiationResult;
      }

    } else if (decision.next === "QA") {
      if (!data?.briefContent || !data?.deliverableContent) {
        responseContent = "Error: Missing brief or deliverable content for QA.";
      } else {
        const qaResult = await qaSentinelAgent.execute({
          briefContent: data.briefContent,
          deliverableContent: data.deliverableContent,
          deliverableType: data.deliverableType || "TEXT"
        });
        if (qaResult.isSuccess()) {
          const qa = qaResult.getValue();
          responseContent = `QA Review Complete. Status: ${qa.status}. Score: ${qa.score}/100. Feedback: ${qa.feedback}`;
          actionTaken = qa;
        } else {
          responseContent = `QA Review Failed: ${qaResult.getError().message}`;
        }
      }

    } else {
      // General Chat / Fallback
      const chatSchema = z.object({ text: z.string() });

      const chatPrompt = PromptRegistry.get('GENERAL_CHAT', 'v1')({
        data,
        history: messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n'),
        lastMessage: messages[messages.length - 1].content
      });

      const chatResult = await executeAIFlow({
        name: 'GeneralChat',
        input: { messages, data },
        outputSchema: chatSchema,
        prompt: chatPrompt,
        useCache: true
      });

      responseContent = chatResult.success ? chatResult.data.text : "Lo siento, error de conexión.";
    }

    // 3. Update History
    const newHistory = [
      ...messages,
      { role: "model" as const, content: responseContent }
    ];

    return {
      response: responseContent,
      history: newHistory,
      next: decision.next,
      actionTaken
    };
  }
);
