// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { QuoteSession, QuoteOption, MarketSegment, QuoteItemRequested as _QuoteItemRequested } from '../../domain/quote/QuoteTypes';

export class VariantGeneratorService {

    // Matriz de márgenes según Master Informe
    private marginMatrix: Record<MarketSegment, { ECONOMICA: number, RECOMENDADA: number, PREMIUM: number }> = {
        CORPORATIVO: { ECONOMICA: 35, RECOMENDADA: 42, PREMIUM: 50 },
        AGENCIA: { ECONOMICA: 15, RECOMENDADA: 20, PREMIUM: 25 },
        SOCIAL_PREMIUM: { ECONOMICA: 30, RECOMENDADA: 38, PREMIUM: 45 },
        PUBLICO: { ECONOMICA: 10, RECOMENDADA: 15, PREMIUM: 20 },
    };

    /**
     * Paso 1: Inferir Segmento a partir de los datos crudos del Wizard (Tipo de Evento)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public inferSegment(eventType: string, _company?: string): MarketSegment {
        const typeNormalized = (eventType || '').toUpperCase();

        if (typeNormalized.includes('AGENCIA') || typeNormalized.includes('BTL') || typeNormalized.includes('PRODUCTORA')) {
            return 'AGENCIA';
        }

        if (typeNormalized.includes('MUNICIP') || typeNormalized.includes('PÚBLICO') || typeNormalized.includes('PUBLICO') || typeNormalized.includes('ESTADO')) {
            return 'PUBLICO';
        }

        if (typeNormalized.includes('BODA') || typeNormalized.includes('SOCIAL') || typeNormalized.includes('MATRIMONIO') || typeNormalized.includes('GALA')) {
            return 'SOCIAL_PREMIUM';
        }

        // Por defecto, asumimos Corporativo para lanzamientos, seminarios, convenciones
        return 'CORPORATIVO';
    }

    /**
     * Paso 2: Generador Principal de Opciones (Pricing dinámico)
     * Utiliza el presupuesto deseado del usuario como ancla comercial (Pricing Top-Down) 
     * y aplica los márgenes estrictos de la Matriz definida en el Master Informe.
     */
    public generateOptions(session: Partial<QuoteSession>): QuoteOption[] {
        const segment = session.segment || 'CORPORATIVO';
        const margins = this.marginMatrix[segment];
        const targetBudget = session.budget || 5000000; // Presupuesto Base de anclaje (Paso 4 Wizard)

        const requestedItems = session.requestedItems || [];
        const catalogItemIds = requestedItems
            .filter(i => i.catalogItemId)
            .map(i => i.catalogItemId as string);

        return [
            {
                optionType: 'ECONOMICA',
                // Simulamos un ajuste del presupuesto hacia abajo (-15%)
                totalValue: targetBudget * 0.85,
                marginApplied: margins.ECONOMICA,
                configNotes: `[Regla: ${segment}] Ajustado a presupuesto (-15%) con enfoque funcional técnico básico. Margen Aplicado: ${margins.ECONOMICA}%.`,
                includedCatalogItems: catalogItemIds.slice(0, Math.max(1, catalogItemIds.length - 1))
            },
            {
                optionType: 'RECOMENDADA',
                // Opción sweet-spot (+10%)
                totalValue: targetBudget * 1.10,
                marginApplied: margins.RECOMENDADA,
                configNotes: `[Regla: ${segment}] Solución recomendada (+10% ancla), equilibrio óptimo calidad/precio. Margen Aplicado: ${margins.RECOMENDADA}%.`,
                includedCatalogItems: catalogItemIds
            },
            {
                optionType: 'PREMIUM',
                // Variante con margen rico y extras (+50%)
                totalValue: targetBudget * 1.50,
                marginApplied: margins.PREMIUM,
                configNotes: `[Regla: ${segment}] Solución alta gama (+50% ancla). Enfoque en spectacularidad y "wow factor". Margen Aplicado: ${margins.PREMIUM}%.`,
                includedCatalogItems: [...catalogItemIds]
            }
        ];
    }
}
