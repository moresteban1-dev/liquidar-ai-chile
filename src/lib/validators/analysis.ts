
import { z } from 'zod';

export const analysisInputSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres').max(50000),
    type: z.enum(['bias', 'fallacy', 'summary']),
    options: z.object({
        depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
        language: z.string().default('es'),
    }).optional(),
}).strict().superRefine((val, ctx) => {
    if (val.options?.depth === 'deep' && val.content.length < 50) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El análisis profundo requiere un texto más extenso (mínimo 50 caracteres).",
            path: ["content"],
        });
    }
});

export type AnalysisInput = z.infer<typeof analysisInputSchema>;
