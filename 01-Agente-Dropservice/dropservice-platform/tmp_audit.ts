
import { DomainIntegrityScanner } from './scripts/diagnostics/scanners/domain.scanner';
import { InfrastructureScanner } from './scripts/diagnostics/scanners/infrastructure.scanner';
import { SecurityScanner } from './scripts/diagnostics/scanners/security.scanner';
import { PerformanceScanner } from './scripts/diagnostics/scanners/performance.scanner';
import * as fs from 'fs';

async function countCriticals() {
  const scanners = [
    new DomainIntegrityScanner(),
    new InfrastructureScanner(),
    new SecurityScanner(),
    new PerformanceScanner()
  ];

  let output = "--- COUNTER --- \n";
  for (const scanner of scanners) {
    try {
      const result = await scanner.scan();
      const criticals = result.findings.filter(f => f.severity === 'critical');
      output += `Scanner: ${scanner.name} | Criticals: ${criticals.length}\n`;
      criticals.forEach(f => {
        output += `  - ${f.title} (${f.file})\n`;
      });
    } catch (e) {
      output += `Scanner: ${scanner.name} | CRASH: ${e}\n`;
    }
  }
  fs.writeFileSync('critical_audit.txt', output);
}

countCriticals();
