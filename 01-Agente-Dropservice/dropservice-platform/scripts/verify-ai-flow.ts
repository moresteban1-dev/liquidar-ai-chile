// scripts/verify-ai-flow.ts
import { container } from '../src/infrastructure/di/bindings';
import { generateMarketingAction } from '../src/actions/catalog';
import { predictPriceAction } from '../src/actions/pricing-actions';
import { auditActiveSLAAction } from '../src/actions/sla-actions';
import { logger } from '../src/infrastructure/telemetry/StructuredLogger';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function runFullVerification() {
    console.log('🚀 Iniciando Escaneo de Salud de IA (Full Flow)...');
    
    try {
        // 1. Verificar MarketingGenius
        console.log('\n--- [1/3] Probando MarketingGenius ---');
        const marketingRes = await generateMarketingAction('test-item-id');
        if (marketingRes.success) {
            console.log('✅ MarketingGenius OK:', marketingRes.data);
        } else {
            console.error('❌ MarketingGenius Falló:', marketingRes.error);
        }

        // 2. Verificar PricingOracle
        console.log('\n--- [2/3] Probando PricingOracle ---');
        const pricingRes = await predictPriceAction({
            serviceId: 'test-service-id',
            historicalCosts: [1000, 1200],
            historicalPrices: [1500, 1800],
            complexity: 'MEDIUM'
        });
        if (pricingRes.success) {
            console.log('✅ PricingOracle OK:', pricingRes.data);
        } else {
            console.error('❌ PricingOracle Falló:', pricingRes.error);
        }

        // 3. Verificar SLAGuardian
        console.log('\n--- [3/3] Probando SLAGuardian ---');
        const slaRes = await auditActiveSLAAction();
        if (slaRes.success) {
            console.log('✅ SLAGuardian OK: Auditoría completada.');
        } else {
            console.error('❌ SLAGuardian Falló:', slaRes.error);
        }

        console.log('\n✨ Escaneo completado con éxito.');
    } catch (error) {
        console.error('💥 Error fatal durante el escaneo:', error);
        process.exit(1);
    }
}

runFullVerification();
