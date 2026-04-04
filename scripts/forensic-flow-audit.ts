import { createServiceRoleClient } from '@/lib/supabase/api';
import { v4 as uuidv4 } from 'uuid';

const supabase = createServiceRoleClient();

async function runForensicAudit() {
    console.log('='.repeat(60));
    console.log('🛡️  AUDITORÍA FORENSE DEL FLUJO OPERACIONAL');
    console.log('='.repeat(60));
    
    const audit = {
        timestamp: new Date().toISOString(),
        flows: [] as any[],
        findings: [] as string[],
        overallStatus: 'UNKNOWN' as 'OPERATIONAL' | 'PARTIAL' | 'BROKEN'
    };

    try {
        console.log('\n📋 FASE 1: Verificando estructura de datos del catálogo...');
        
        const { data: catalogItems, error: catError } = await supabase
            .from('catalog_items')
            .select('id, name, type, status, priceSuggested, priceReferenceMin, priceReferenceMax')
            .eq('status', 'active')
            .limit(5);
        
        if (catError) {
            audit.findings.push(`ERROR catálogo: ${catError.message}`);
            console.log('❌ Error al consultar catálogo');
        } else if (!catalogItems || catalogItems.length === 0) {
            audit.findings.push('WARNING: No hay items activos en el catálogo');
            console.log('⚠️  No hay items activos en el catálogo');
        } else {
            console.log(`✅ Catálogo: ${catalogItems.length} items activos encontrados`);
            console.log('   Items:', catalogItems.map(i => i.name).join(', '));
        }

        console.log('\n📋 FASE 2: Verificando estructura de cotizaciones...');
        
        const { data: quotations, error: quotError } = await supabase
            .from('quotations')
            .select('id, code, status, client_id, assigned_provider_id')
            .limit(5);
        
        if (quotError) {
            audit.findings.push(`ERROR quotations: ${quotError.message}`);
            console.log('❌ Error al consultar cotizaciones');
        } else {
            console.log(`✅ quotations: tabla accesible, ${quotations?.length || 0} registros`);
        }

        console.log('\n📋 FASE 3: Verificando estados de cotización (FSM)...');
        
        const { data: statuses, error: statusError } = await supabase
            .from('quotations')
            .select('status')
            .limit(100);
        
        if (!statusError && statuses) {
            const statusCounts = statuses.reduce((acc: any, s: any) => {
                acc[s.status] = (acc[s.status] || 0) + 1;
                return acc;
            }, {});
            console.log('   Estados encontrados:', Object.entries(statusCounts).map(([k,v]) => `${k}:${v}`).join(', '));
        }

        console.log('\n📋 FASE 4: Verificando tablas de soporte...');
        
        const tables = [
            'quotation_items',
            'quotation_provider_items', 
            'provider_bids',
            'quotation_history'
        ];
        
        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                audit.findings.push(`ERROR tabla ${table}: ${error.message}`);
                console.log(`❌ ${table}: ${error.message}`);
            } else {
                console.log(`✅ ${table}: ${count || 0} registros`);
            }
        }

        console.log('\n📋 FASE 5: Verificando funciones y triggers...');
        
        const { data: functions, error: funcError } = await supabase
            .rpc('get_user_role', { user_id: uuidv4() });
        
        if (funcError) {
            audit.findings.push(`INFO: función get_user_role no disponible: ${funcError.message}`);
        } else {
            console.log('✅ Funciones RPC disponibles');
        }

        audit.overallStatus = audit.findings.filter(f => f.startsWith('ERROR')).length === 0 ? 'OPERATIONAL' : 'PARTIAL';
        
    } catch (err: any) {
        audit.findings.push(`FATAL: ${err.message}`);
        audit.overallStatus = 'BROKEN';
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DE AUDITORÍA');
    console.log('='.repeat(60));
    console.log('Estado general:', audit.overallStatus);
    console.log('Hallazgos:', audit.findings.length);
    audit.findings.forEach(f => console.log(' -', f));
    
    return audit;
}

runForensicAudit()
    .then(audit => {
        console.log('\n🎯 Auditoría completada:', audit.overallStatus);
        process.exit(audit.overallStatus === 'OPERATIONAL' ? 0 : 1);
    })
    .catch(err => {
        console.error('❌ Error en auditoría:', err);
        process.exit(1);
    });
