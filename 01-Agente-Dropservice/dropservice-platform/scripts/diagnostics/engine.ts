import * as fs from 'fs';
import * as path from 'path';
import type {
  Scanner,
  DiagnosticReport,
  ScanResult,
  Severity,
} from './types';

export class DiagnosticEngine {
  private scanners: Scanner[] = [];
  private startTime = 0;

  register(scanner: Scanner): this {
    this.scanners.push(scanner);
    return this;
  }

  registerAll(scanners: Scanner[]): this {
    this.scanners.push(...scanners);
    return this;
  }

  async run(options?: {
    only?: string[];
    skip?: string[];
    verbose?: boolean;
  }): Promise<DiagnosticReport> {
    this.startTime = Date.now();
    const results: ScanResult[] = [];

    // Filtrar scanners según opciones
    let activeScanners = this.scanners;
    if (options?.only?.length) {
      activeScanners = this.scanners.filter((s) =>
        options.only!.includes(s.name),
      );
    }
    if (options?.skip?.length) {
      activeScanners = activeScanners.filter(
        (s) => !options.skip!.includes(s.name),
      );
    }

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  🏥 PLATFORM DIAGNOSTIC SYSTEM v1.0             ║');
    console.log('║  Dropservice Platform — Deep Health Analysis     ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📋 Scanners registrados: ${activeScanners.length}`);
    console.log(`⏱️  Inicio: ${new Date().toISOString()}`);
    console.log('');

    // Ejecutar cada scanner secuencialmente
    for (const scanner of activeScanners) {
      console.log(`🔍 [${scanner.name}] ${scanner.description}...`);
      const scanStart = Date.now();

      try {
        const result = await scanner.scan();
        result.duration = Date.now() - scanStart;
        results.push(result);

        const icon =
          result.status === 'pass'
            ? '✅'
            : result.status === 'warn'
              ? '⚠️'
              : '❌';
        console.log(
          `${icon} [${scanner.name}] Score: ${result.score}/100 | ` +
            `Findings: ${result.findings.length} | ${result.duration}ms`,
        );

        if (options?.verbose && result.findings.length > 0) {
          for (const f of result.findings.slice(0, 5)) {
            const sIcon = this.severityIcon(f.severity);
            console.log(`   ${sIcon} ${f.title}`);
            if (f.file) console.log(`      📄 ${f.file}:${f.line ?? ''}`);
          }
          if (result.findings.length > 5) {
            console.log(
              `   ... y ${result.findings.length - 5} más`,
            );
          }
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown scanner error';
        console.log(`💥 [${scanner.name}] CRASH: ${errorMsg}`);
        results.push({
          scanner: scanner.name,
          status: 'error',
          score: 0,
          duration: Date.now() - scanStart,
          findings: [
            {
              id: `${scanner.name}-crash`,
              scanner: scanner.name,
              severity: 'critical',
              title: `Scanner crashed: ${errorMsg}`,
              description: errorMsg,
              suggestion: 'Verificar dependencias del scanner',
              autoFixable: false,
              category: 'system',
            },
          ],
          summary: `Scanner failed: ${errorMsg}`,
        });
      }
      console.log('');
    }

    return this.buildReport(results);
  }

  private buildReport(results: ScanResult[]): DiagnosticReport {
    const allFindings = results.flatMap((r) => r.findings);

    // Score ponderado
    const totalWeight = this.scanners.reduce(
      (sum, s) => sum + s.weight,
      0,
    );
    const weightedScore =
      results.reduce((sum, r, i) => {
        const weight = this.scanners[i]?.weight ?? 1;
        return sum + r.score * weight;
      }, 0) / (totalWeight || 1);

    const overallScore = Math.round(weightedScore);

    const severityCounts = {
      critical: allFindings.filter((f) => f.severity === 'critical')
        .length,
      high: allFindings.filter((f) => f.severity === 'high').length,
      medium: allFindings.filter((f) => f.severity === 'medium')
        .length,
      low: allFindings.filter((f) => f.severity === 'low').length,
    };

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      platform: 'Dropservice Platform',
      version: this.getPackageVersion(),
      nodeVersion: process.version,
      overallScore,
      overallGrade: this.scoreToGrade(overallScore),
      scanResults: results,
      totalFindings: allFindings.length,
      criticalCount: severityCounts.critical,
      highCount: severityCounts.high,
      mediumCount: severityCounts.medium,
      lowCount: severityCounts.low,
      executionTime: Date.now() - this.startTime,
      recommendations: this.generateRecommendations(
        results,
        severityCounts as Record<string, number>,
      ),
    };

    return report;
  }

  private scoreToGrade(score: number): string {
    if (score >= 95) return 'AAA';
    if (score >= 90) return 'AA';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private generateRecommendations(
    results: ScanResult[],
    counts: Record<string, number>,
  ): string[] {
    const recs: string[] = [];

    const criticalCount = counts?.critical || 0;
    if (criticalCount > 0) {
      recs.push(
        `🚨 HAY ${criticalCount} HALLAZGO(S) CRÍTICO(S). Resolver antes de cualquier deploy.`,
      );
    }

    const codes: Record<string, number> = {};
    const errorLines = results.flatMap(r => r.findings.map(f => f.description));
    errorLines.forEach(l => {
        const m = l.match(/error (TS\d+):/);
        if (m && m[1]) {
            const code = m[1];
            codes[code] = (codes[code] || 0) + 1;
        }
    });
    
    recs.push('## 1. TSC — POR TIPO DE ERROR');
    Object.entries(codes).sort((a,b) => (b[1] as number) - (a[1] as number)).forEach(([k, v]) => {
        recs.push(`- **${k}**: ${v}`);
    });

    const failedScanners = results.filter((r) => r.status === 'fail');
    for (const s of failedScanners) {
      recs.push(`❌ Scanner '${s.scanner}' falló: ${s.summary}`);
    }

    const lowScoreScanners = results
      .filter((r) => r.score < 70)
      .sort((a, b) => a.score - b.score);
    for (const s of lowScoreScanners) {
      recs.push(
        `📉 '${s.scanner}' tiene score ${s.score}/100. Priorizar mejoras.`,
      );
    }

    const autoFixable = results
      .flatMap((r) => r.findings)
      .filter((f) => f.autoFixable);
    if (autoFixable.length > 0) {
      recs.push(
        `🔧 ${autoFixable.length} hallazgos son auto-fixeables. Ejecutar: npx tsx scripts/diagnostics/auto-fix.ts`,
      );
    }

    return recs;
  }

  private severityIcon(severity: Severity): string {
    const icons: Record<Severity, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };
    return icons[severity];
  }

  private getPackageVersion(): string {
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version ?? '0.0.0';
    } catch {
      return '0.0.0';
    }
  }
}
