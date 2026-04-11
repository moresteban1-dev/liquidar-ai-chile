import { QuoteSession, QuoteOption, MarketSegment } from '@/core/domain/quote/QuoteTypes';
import { Result, ok, fail } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';

/**
 * VariantGeneratorService
 * 
 * Generador de variantes comerciales (ECONOMICA, RECOMENDADA, PREMIUM)
 * basado en la segmentación de mercado y presupuestos ancla.
 */
export class VariantGeneratorService {

    // Matriz de márgenes según Master Informe
    private marginMatrix: Record<MarketSegment, { ECONOMICA: number, RECOMENDADA: number, PREMIUM: number }> = {
        CORPORATIVO: { ECONOMICA: 35, RECOMENDADA: 42, PREMIUM: 50 },
        AGENCIA: { ECONOMICA: 15, RECOMENDADA: 20, PREMIUM: 25 },
        SOCIAL_PREMIUM: { ECONOMICA: 30, RECOMENDADA: 38, PREMIUM: 45 },
        PUBLICO: { ECONOMICA: 10, RECOMENDADA: 15, PREMIUM: 20 },
    };

    /**
     * Paso 1: Inferir Segmento a partir de los datos crudos del Wizard
     */
    public inferSegment(eventType: string, _company?: string): MarketSegment {
        const typeNormalized = (eventType || '').toUpperCase().trim();

        if (typeNormalized.includes('AGENCIA') || typeNormalized.includes('BTL') || typeNormalized.includes('PRODUCTORA')) {
            return 'AGENCIA';
        }

        if (
            typeNormalized.includes('MUNICIP') || 
            typeNormalized.includes('PÚBLICO') || 
            typeNormalized.includes('PUBLICO') || 
            typeNormalized.includes('ESTADO') ||
            typeNormalized.includes('GOBIERNO')
        ) {
            return 'PUBLICO';
        }

        if (
            typeNormalized.includes('BODA') || 
            typeNormalized.includes('SOCIAL') || 
            typeNormalized.includes('MATRIMONIO') || 
            typeNormalized.includes('GALA') ||
            typeNormalized.includes('FIESTA')
        ) {
            return 'SOCIAL_PREMIUM';
        }

        // Por defecto, asumimos Corporativo (Lanzamientos, seminarios, convenciones)
        return 'CORPORATIVO';
    }

    /**
     * Paso 2: Generador Principal de Opciones (Pricing dinámico)
     * Utiliza el presupuesto deseado del usuario como ancla comercial (Pricing Top-Down) 
     * y aplica los márgenes estrictos de la Matriz definida en el Master Informe.
     */
    public generateOptions(session: Partial<QuoteSession>): Result<QuoteOption[], AppError> {
        const segment = session.segment || 'CORPORATIVO';
        const margins = this.marginMatrix[segment];
        
        const targetBudget = session.budget || 0;
        if (targetBudget <= 0) {
            return fail(AppError.validation('El presupuesto ancla debe ser mayor a 0 para generar opciones.'));
        }

        if (!session.eventType) {
            return fail(AppError.validation('El tipo de evento es requerido para segmentar la cotización.'));
        }

        const requestedItems = session.requestedItems || [];
        const catalogItemIds = requestedItems
            .filter(i => i.catalogItemId)
            .map(i => i.catalogItemId as string);

        const options: QuoteOption[] = [
            {
                optionType: 'ECONOMICA',
                // Ajuste del presupuesto hacia abajo (-15%)
                totalValue: targetBudget * 0.85,
                marginApplied: margins.ECONOMICA,
                configNotes: `[Regla: ${segment}] Ajustado a presupuesto (-15%) con enfoque funcional técnico básico.`,
                includedCatalogItems: catalogItemIds.slice(0, Math.max(1, catalogItemIds.length - 1))
            },
            {
                optionType: 'RECOMENDADA',
                // Opción sweet-spot (+10%)
                totalValue: targetBudget * 1.10,
                marginApplied: margins.RECOMENDADA,
                configNotes: `[Regla: ${segment}] Solución recomendada (+10% ancla), equilibrio óptimo calidad/precio.`,
                includedCatalogItems: catalogItemIds
            },
            {
                optionType: 'PREMIUM',
                // Variante con margen rico y extras (+50%)
                totalValue: targetBudget * 1.50,
                marginApplied: margins.PREMIUM,
                configNotes: `[Regla: ${segment}] Solución alta gama (+50% ancla). Enfoque en spectacularidad y "wow factor".`,
                includedCatalogItems: [...catalogItemIds]
            }
        ];

        return ok(options);
    }
}
