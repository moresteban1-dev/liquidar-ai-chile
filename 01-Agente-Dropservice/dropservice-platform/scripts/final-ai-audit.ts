// scripts/final-ai-audit.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Force load env from .env.local
const envPath = resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log('🔍 Audit System Initializing...');
console.log('Env Path:', envPath);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');

import { container, DI_KEYS } from '../src/infrastructure/di/bindings';

async function audit() {
    console.log('\n--- PHASE 1: Dependency Injection Check ---');
    try {
        const _catalog = await container.resolve(DI_KEYS.CatalogService);
        const _pricing = await container.resolve(DI_KEYS.PricingCalculatorService);
        const _sla = await container.resolve(DI_KEYS.SLAService);
        console.log('✅ All AI Services resolved correctly.');
    } catch (e: any) {
        console.error('❌ DI Resolution Failed:', e.message);
        return;
    }

    console.log('\n--- PHASE 2: AI Agent Live Surface Check ---');
    // We will test the "surface" of the methods to ensure they exist and are async
    try {
        const catalog: any = await container.resolve(DI_KEYS.CatalogService);
        if (typeof catalog.generateServiceMarketing === 'function') {
            console.log('✅ MarketingGenius: Service method available.');
        }

        const pricing: any = await container.resolve(DI_KEYS.PricingCalculatorService);
        if (typeof pricing.predictOptimalPrice === 'function') {
            console.log('✅ PricingOracle: Prediction method available.');
        }

        const sla: any = await container.resolve(DI_KEYS.SLAService);
        if (typeof sla.checkOrderSLARisk === 'function') {
            console.log('✅ SLAGuardian: Risk check method available.');
        }
    } catch (e: any) {
        console.error('❌ Method Check Failed:', e.message);
    }

    console.log('\n--- PHASE 3: Content Generation (MarketingGenius) ---');
    try {
        const catalog: any = await container.resolve(DI_KEYS.CatalogService);
        console.log('⏳ Requesting marketing content from IA...');
        const result = await catalog.generateServiceMarketing('audit-test-id');
        if (result.isSuccess()) {
            console.log('🚀 AI Output:', JSON.stringify(result.getValue(), null, 2));
        } else {
            console.log('⚠️ AI Agent returned an error (likely missing valid item in DB):', result.getError());
        }
    } catch (e: any) {
        console.error('❌ Marketing Generation Failed:', e.message);
    }

    console.log('\n--- AUDIT COMPLETE ---');
}

audit().catch(err => {
    console.error('Fatal Audit Error:', err);
    process.exit(1);
});
