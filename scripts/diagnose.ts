
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                  PLATFORM DIAGNOSTIC SYSTEM                  ║
 * ║                     EntryPoint - CLI                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { DiagnosticEngine } from './diagnostics/engine';
import { DiagnosticReporter } from './diagnostics/reporter';
import { TypeScriptScanner } from './diagnostics/scanners/typescript.scanner';
import { DomainIntegrityScanner } from './diagnostics/scanners/domain.scanner';
import { InfrastructureScanner } from './diagnostics/scanners/infrastructure.scanner';
import { SecurityScanner } from './diagnostics/scanners/security.scanner';
import { PerformanceScanner } from './diagnostics/scanners/performance.scanner';

async function main() {
  console.log('\n🚀 Iniciando Platform Diagnostic System (PDS) - Enterprise Grade\n');

  const engine = new DiagnosticEngine();
  const reporter = new DiagnosticReporter();

  // Registrar Scanners
  engine.register(new TypeScriptScanner());
  engine.register(new DomainIntegrityScanner());
  engine.register(new InfrastructureScanner());
  engine.register(new SecurityScanner());
  engine.register(new PerformanceScanner());

  try {
    // 1. Ejecutar diagnóstico
    const report = await engine.run();

    // 2. Generar Reporte Visual en Consola
    reporter.reportToConsole(report);

    // 3. Generar Reporte en Markdown para el Brain/Artifacts
    const mdPath = 'PDS_LAST_DIAGNOSTIC.md';
    reporter.reportToMarkdown(report, mdPath);

    console.log(`\n📄 Reporte detallado guardado en: ${mdPath}`);

    // 4. Determinar exit code basado en criticidad
    const hasFailures = report.scanResults.some(r => r.status === 'fail');
    const criticalFindings = report.scanResults.flatMap(r => r.findings).filter(f => f.severity === 'critical');

    if (criticalFindings.length > 0) {
      console.log('\n❌ [CRITICAL] Se encontraron fallos críticos. El sistema no es seguro/estable para producción.\n');
      process.exit(1);
    }

    if (hasFailures) {
      console.log('\n⚠️ [WARN] Se encontraron fallos. Revisar reporte antes de proceder.\n');
      // No salimos con 1 para permitir flujo de IA, pero alertamos
    } else {
      console.log('\n✅ [SUCCESS] Sistema saludable y en cumplimiento arquitectónico.\n');
    }

  } catch (error) {
    console.error('\n💥 Error fatal durante el diagnóstico:', error);
    process.exit(1);
  }
}

main();
