
import { TypeScriptScanner } from './scripts/diagnostics/scanners/typescript.scanner';
import { DomainIntegrityScanner } from './scripts/diagnostics/scanners/domain.scanner';
import { InfrastructureScanner } from './scripts/diagnostics/scanners/infrastructure.scanner';
import { SecurityScanner } from './scripts/diagnostics/scanners/security.scanner';
import { PerformanceScanner } from './scripts/diagnostics/scanners/performance.scanner';

async function findCriticals() {
  const scanners = [
    new TypeScriptScanner(),
    new DomainIntegrityScanner(),
    new InfrastructureScanner(),
    new SecurityScanner(),
    new PerformanceScanner()
  ];

  console.log("--- START SCAN ---");
  for (const scanner of scanners) {
    try {
      console.log(`Scanning: ${scanner.name}...`);
      const result = await scanner.scan();
      console.log(`  Done: ${scanner.name}. Score: ${result.score}. Findings: ${result.findings.length}`);
      const criticals = result.findings.filter(f => f.severity === 'critical');
      if (criticals.length > 0) {
        console.log(`  🔴 CRITICAL FINDINGS in [${scanner.name}]:`);
        criticals.forEach(f => {
          console.log(`    - ${f.title}`);
          console.log(`      File: ${f.file}:${f.line}`);
        });
      }
    } catch (e) {
      console.log(`  💥 CRASH in ${scanner.name}: ${e}`);
    }
  }
  console.log("--- END SCAN ---");
}

findCriticals();
