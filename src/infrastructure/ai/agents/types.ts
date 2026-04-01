import { z } from 'zod';

// Common schemas for all agents

export const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// Negotiator Specifics
export const NegotiatorInputSchema = z.object({
  priceCost: z.number(),
  serviceCategory: z.string(),
  providerId: z.string().optional(),
  history: z.array(MessageSchema).optional(),
});

export const NegotiatorOutputSchema = z.object({
  decision: z.enum(["APPROVE", "NEGOTIATE", "REJECT"]),
  confidence: z.number().min(0).max(1),
  autonomyLevel: z.enum(["full_auto", "suggest", "human_only"]),
  reasoning: z.string(),
  suggestedCounterOffer: z.number().optional(),
  replyToUser: z.string(),
});

// QA Specifics
export const QAInputSchema = z.object({
  briefContent: z.string(),
  deliverableContent: z.string(), // Text or URL description
  deliverableType: z.enum(["IMAGE", "TEXT", "DOCUMENT", "URL"]),
  history: z.array(MessageSchema).optional(),
});

export const QAOutputSchema = z.object({
  status: z.enum(["PASS", "FAIL", "NEEDS_REVISION"]),
  confidence: z.number().min(0).max(1),
  autonomyLevel: z.enum(["full_auto", "suggest", "human_only"]),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  issues: z.array(z.string()).optional(),
});

// Supervisor Routing
export const SupervisorInputSchema = z.object({
  messages: z.array(MessageSchema),
  context: z.any().optional(),
});

export const SupervisorOutputSchema = z.object({
  nextAgent: z.enum(["Negotiator", "QA", "User"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// Marketing Specifics
export const MarketingInputSchema = z.object({
  serviceName: z.string(),
  categoryName: z.string(),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
});

export const MarketingOutputSchema = z.object({
  seoTitle: z.string(),
  metaDescription: z.string(),
  persuasiveCopy: z.string(),
  features: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// Pricing Specifics
export const PricingInputSchema = z.object({
  serviceId: z.string().optional(),
  historicalCosts: z.array(z.number()),
  historicalPrices: z.array(z.number()),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  marketTrends: z.string().optional(),
});

export const PricingOutputSchema = z.object({
  suggestedCost: z.number(),
  suggestedPrice: z.number(),
  margin: z.number(), // Percentage
  confidence: z.number().min(0).max(1),
  isSecure: z.boolean(), // Within 10% corridor
  reasoning: z.string(),
});

// SLA Specifics
export const SLAInputSchema = z.object({
  orderId: z.string(),
  createdAt: z.string(),
  eventDate: z.string(),
  deliveryDays: z.number(),
  providerHistory: z.object({
    avgDelayDays: z.number(),
    completedOrders: z.number(),
  }).optional(),
});

export const SLAOutputSchema = z.object({
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  daysUntilDeadline: z.number(),
  isAlertNeeded: z.boolean(),
  alertType: z.enum(["PREVENTIVE", "CRITICAL", "NONE"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
