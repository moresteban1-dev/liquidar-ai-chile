import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = !process.argv.includes('--apply');

// ═══════════════════════════════════════════
// MAPA DE REEMPLAZOS
// ═══════════════════════════════════════════

interface Replacement {
  /** Regex para buscar */
  pattern: RegExp;
  /** Reemplazo */
  replacement: string;
  /** Descripción */
  description: string;
}

const REPLACEMENTS: Replacement[] = [
  // Order statuses — strings literales con comillas
  { pattern: /'BORRADOR'/g, replacement: "'DRAFT'", description: "BORRADOR → DRAFT" },
  { pattern: /"BORRADOR"/g, replacement: '"DRAFT"', description: 'BORRADOR → DRAFT' },

  { pattern: /'PENDIENTE_PAGO'/g, replacement: "'PENDING_PAYMENT'", description: "PENDIENTE_PAGO → PENDING_PAYMENT" },
  { pattern: /"PENDIENTE_PAGO"/g, replacement: '"PENDING_PAYMENT"', description: 'PENDIENTE_PAGO → PENDING_PAYMENT' },

  { pattern: /'ESPERANDO_PAGO'/g, replacement: "'PENDING_PAYMENT'", description: "ESPERANDO_PAGO → PENDING_PAYMENT" },
  { pattern: /"ESPERANDO_PAGO"/g, replacement: '"PENDING_PAYMENT"', description: 'ESPERANDO_PAGO → PENDING_PAYMENT' },

  { pattern: /'PAGADO'/g, replacement: "'PAID'", description: "PAGADO → PAID" },
  { pattern: /"PAGADO"/g, replacement: '"PAID"', description: 'PAGADO → PAID' },
  { pattern: /'PAGADA'/g, replacement: "'PAID'", description: "PAGADA → PAID" },
  { pattern: /"PAGADA"/g, replacement: '"PAID"', description: 'PAGADA → PAID' },

  { pattern: /'EN_PROGRESO'/g, replacement: "'IN_PROGRESS'", description: "EN_PROGRESO → IN_PROGRESS" },
  { pattern: /"EN_PROGRESO"/g, replacement: '"IN_PROGRESS"', description: 'EN_PROGRESO → IN_PROGRESS' },

  { pattern: /'EN_PRODUCCION'/g, replacement: "'IN_PRODUCTION'", description: "EN_PRODUCCION → IN_PRODUCTION" },
  { pattern: /"EN_PRODUCCION"/g, replacement: '"IN_PRODUCTION"', description: 'EN_PRODUCCION → IN_PRODUCTION' },

  { pattern: /'REVISION_INTERNA'/g, replacement: "'INTERNAL_REVIEW'", description: "REVISION_INTERNA → INTERNAL_REVIEW" },
  { pattern: /"REVISION_INTERNA"/g, replacement: '"INTERNAL_REVIEW"', description: 'REVISION_INTERNA → INTERNAL_REVIEW' },

  { pattern: /'EN_REVISION'/g, replacement: "'UNDER_REVIEW'", description: "EN_REVISION → UNDER_REVIEW" },
  { pattern: /"EN_REVISION"/g, replacement: '"UNDER_REVIEW"', description: 'EN_REVISION → UNDER_REVIEW' },

  { pattern: /'CON_OBSERVACIONES'/g, replacement: "'REVISION_REQUESTED'", description: "CON_OBSERVACIONES → REVISION_REQUESTED" },
  { pattern: /"CON_OBSERVACIONES"/g, replacement: '"REVISION_REQUESTED"', description: 'CON_OBSERVACIONES → REVISION_REQUESTED' },

  { pattern: /'ASIGNADA'/g, replacement: "'ASSIGNED'", description: "ASIGNADA → ASSIGNED" },
  { pattern: /"ASIGNADA"/g, replacement: '"ASSIGNED"', description: 'ASIGNADA → ASSIGNED' },

  { pattern: /'PAGO_FALLIDO'/g, replacement: "'PAYMENT_FAILED'", description: "PAGO_FALLIDO → PAYMENT_FAILED" },
  { pattern: /"PAGO_FALLIDO"/g, replacement: '"PAYMENT_FAILED"', description: 'PAGO_FALLIDO → PAYMENT_FAILED' },

  { pattern: /'REVISION_CALIDAD'/g, replacement: "'QUALITY_REVIEW'", description: "REVISION_CALIDAD → QUALITY_REVIEW" },
  { pattern: /"REVISION_CALIDAD"/g, replacement: '"QUALITY_REVIEW"', description: 'REVISION_CALIDAD → QUALITY_REVIEW' },

  { pattern: /'ENTREGADO'/g, replacement: "'DELIVERED'", description: "ENTREGADO → DELIVERED" },
  { pattern: /"ENTREGADO"/g, replacement: '"DELIVERED"', description: 'ENTREGADO → DELIVERED' },
  { pattern: /'ENTREGADA'/g, replacement: "'DELIVERED'", description: "ENTREGADA → DELIVERED" },
  { pattern: /"ENTREGADA"/g, replacement: '"DELIVERED"', description: 'ENTREGADA → DELIVERED' },

  { pattern: /'COMPLETADO'/g, replacement: "'COMPLETED'", description: "COMPLETADO → COMPLETED" },
  { pattern: /"COMPLETADO"/g, replacement: '"COMPLETED"', description: 'COMPLETADO → COMPLETED' },
  { pattern: /'COMPLETADA'/g, replacement: "'COMPLETED'", description: "COMPLETADA → COMPLETED" },
  { pattern: /"COMPLETADA"/g, replacement: '"COMPLETED"', description: 'COMPLETADA → COMPLETED' },

  { pattern: /'CANCELADO'/g, replacement: "'CANCELLED'", description: "CANCELADO → CANCELLED" },
  { pattern: /"CANCELADO"/g, replacement: '"CANCELLED"', description: 'CANCELADO → CANCELLED' },
  { pattern: /'CANCELADA'/g, replacement: "'CANCELLED'", description: "CANCELADA → CANCELLED" },
  { pattern: /"CANCELADA"/g, replacement: '"CANCELLED"', description: 'CANCELADA → CANCELLED' },

  { pattern: /'REEMBOLSADO'/g, replacement: "'REFUNDED'", description: "REEMBOLSADO → REFUNDED" },
  { pattern: /"REEMBOLSADO"/g, replacement: '"REFUNDED"', description: 'REEMBOLSADO → REFUNDED' },
  { pattern: /'REEMBOLSADA'/g, replacement: "'REFUNDED'", description: "REEMBOLSADA → REFUNDED" },
  { pattern: /"REEMBOLSADA"/g, replacement: '"REFUNDED"', description: 'REEMBOLSADA → REFUNDED' },

  { pattern: /'FINALIZADA'/g, replacement: "'FINALIZED'", description: "FINALIZADA → FINALIZED" },
  { pattern: /"FINALIZADA"/g, replacement: '"FINALIZED"', description: 'FINALIZADA → FINALIZED' },

  { pattern: /'EN_DISPUTA'/g, replacement: "'DISPUTED'", description: "EN_DISPUTA → DISPUTED" },
  { pattern: /"EN_DISPUTA"/g, replacement: '"DISPUTED"', description: 'EN_DISPUTA → DISPUTED' },

  // Quotation statuses
  { pattern: /'PENDIENTE_REVISION'/g, replacement: "'PENDING_REVIEW'", description: "PENDIENTE_REVISION → PENDING_REVIEW" },
  { pattern: /"PENDIENTE_REVISION"/g, replacement: '"PENDING_REVIEW"', description: 'PENDIENTE_REVISION → PENDING_REVIEW' },

  { pattern: /'ESPERANDO_PROVEEDOR'/g, replacement: "'AWAITING_PROVIDER'", description: "ESPERANDO_PROVEEDOR → AWAITING_PROVIDER" },
  { pattern: /"ESPERANDO_PROVEEDOR"/g, replacement: '"AWAITING_PROVIDER"', description: 'ESPERANDO_PROVEEDOR → AWAITING_PROVIDER' },

  { pattern: /'EN_NEGOCIACION'/g, replacement: "'NEGOTIATING'", description: "EN_NEGOCIACION → NEGOTIATING" },
  { pattern: /"EN_NEGOCIACION"/g, replacement: '"NEGOTIATING"', description: 'EN_NEGOCIACION → NEGOTIATING' },

  { pattern: /'APROBADO'/g, replacement: "'APPROVED'", description: "APROBADO → APPROVED" },
  { pattern: /"APROBADO"/g, replacement: '"APPROVED"', description: 'APROBADO → APPROVED' },
  { pattern: /'APROBADA'/g, replacement: "'APPROVED'", description: "APROBADA → APPROVED" },
  { pattern: /"APROBADA"/g, replacement: '"APPROVED"', description: 'APROBADA → APPROVED' },

  { pattern: /'RECHAZADO'/g, replacement: "'REJECTED'", description: "RECHAZADO → REJECTED" },
  { pattern: /"RECHAZADO"/g, replacement: '"REJECTED"', description: 'RECHAZADO → REJECTED' },
  { pattern: /'RECHAZADA'/g, replacement: "'REJECTED'", description: "RECHAZADA → REJECTED" },
  { pattern: /"RECHAZADA"/g, replacement: '"REJECTED"', description: 'RECHAZADA → REJECTED' },

  { pattern: /'ENVIADO'/g, replacement: "'SENT_TO_CLIENT'", description: "ENVIADO → SENT_TO_CLIENT" },
  { pattern: /"ENVIADO"/g, replacement: '"SENT_TO_CLIENT"', description: 'ENVIADO → SENT_TO_CLIENT' },
  { pattern: /'ENVIADA'/g, replacement: "'SENT_TO_CLIENT'", description: "ENVIADA → SENT_TO_CLIENT" },
  { pattern: /"ENVIADA"/g, replacement: '"SENT_TO_CLIENT"', description: 'ENVIADA → SENT_TO_CLIENT' },
];

// ═══════════════════════════════════════════
// ARCHIVOS A EXCLUIR
// ═══════════════════════════════════════════
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'OrderStatus.ts',       // Ya migrado (Value Objects)
  'QuotationStatus.ts',   // Ya migrado
  'migrate-statuses',     // Este script
  'status-migration-map',
  'LEGACY_MAP',
  'ORDER_LEGACY_MAP',
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some(p => filePath.includes(p));
}

// ═══════════════════════════════════════════
// SCANNER
// ═══════════════════════════════════════════
function getFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldExclude(fullPath)) continue;

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🔄 MIGRACIÓN DE ESTADOS: Spanish → English      ║');
  console.log(`║  Modo: ${DRY_RUN ? 'DRY RUN (preview)' : '⚠️  APLICANDO CAMBIOS'}${''.padEnd(DRY_RUN ? 13 : 7)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  if (DRY_RUN) {
    console.log('💡 Ejecutar con --apply para aplicar cambios realmente');
    console.log('');
  }

  const files = getFiles('src');
  console.log(`📂 Archivos a escanear: ${files.length}`);
  console.log('');

  let totalReplacements = 0;
  let filesModified = 0;
  const changes: Array<{ file: string; replacements: string[] }> = [];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let originalContent = content;
    const fileReplacements: string[] = [];

    for (const { pattern, replacement, description } of REPLACEMENTS) {
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;

      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        content = content.replace(pattern, replacement);
        fileReplacements.push(`${description} (${matches.length}x)`);
        totalReplacements += matches.length;
      }
    }

    if (content !== originalContent) {
      filesModified++;
      changes.push({ file, replacements: fileReplacements });

      if (!DRY_RUN) {
        fs.writeFileSync(file, content);
      }

      console.log(`📄 ${file}`);
      for (const r of fileReplacements) {
        console.log(`   ✏️  ${r}`);
      }
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════');
  console.log(`📊 Resumen:`);
  console.log(`   Archivos escaneados:  ${files.length}`);
  console.log(`   Archivos modificados: ${filesModified}`);
  console.log(`   Total reemplazos:     ${totalReplacements}`);
  console.log('');

  if (DRY_RUN) {
    console.log('💡 Para aplicar: npx tsx scripts/migrate-statuses.ts --apply');
  } else {
    console.log('✅ Cambios aplicados. Ejecutar:');
    console.log('   npx tsc --noEmit');
    console.log('   npm run build');
  }
}

main();
