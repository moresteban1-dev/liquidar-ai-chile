
import * as fs from 'fs';
import type { DiagnosticReport } from './types';

export class DiagnosticReporter {
  reportToConsole(report: DiagnosticReport): void {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                 🏥 DIAGNOSTIC REPORT                        ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Platform:  ${report.platform.padEnd(44)}║`);
    console.log(`║  Version:   ${report.version.padEnd(44)}║`);
    console.log(`║  Node:      ${report.nodeVersion.padEnd(44)}║`);
    console.log(`║  Timestamp: ${report.timestamp.padEnd(44)}║`);
    console.log(`║  Duration:  ${(report.executionTime / 1000).toFixed(1).padStart(6)}s${''.padEnd(37)}║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');

    const grade = report.overallGrade;
    const score = report.overallScore;
    const bar = '█'.repeat(Math.floor(score / 5)) + '░'.repeat(20 - Math.floor(score / 5));
    const gradeColor =
      score >= 90 ? '🟢' : score >= 70 ? '🟡' : score >= 50 ? '🟠' : '🔴';

    console.log(`║                                                              ║`);
    console.log(`║  ${gradeColor} OVERALL SCORE: ${score}/100 (Grade: ${grade})${''.padEnd(Math.max(0, 27 - grade.length - String(score).length))}║`);
    console.log(`║  [${bar}]${''.padEnd(34)}║`);
    console.log(`║                                                              ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  SCANNER RESULTS                                             ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    for (const result of report.scanResults) {
      const icon =
        result.status === 'pass'
          ? '✅'
          : result.status === 'warn'
            ? '⚠️'
            : result.status === 'error'
              ? '💥'
              : '❌';
      const scoreStr = `${result.score}/100`;
      const findingsStr = `${result.findings.length} findings`;

      console.log(
        `║  ${icon} ${result.scanner.padEnd(22)} ${scoreStr.padEnd(8)} ${findingsStr.padEnd(15)} ${(result.duration + 'ms').padEnd(8)}║`,
      );
    }

    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  FINDINGS SUMMARY                                            ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  🔴 Critical: ${String(report.criticalCount).padEnd(5)} 🟠 High: ${String(report.highCount).padEnd(5)} 🟡 Medium: ${String(report.mediumCount).padEnd(5)} 🔵 Low: ${String(report.lowCount).padEnd(3)}║`);
    console.log(`║  📊 Total: ${report.totalFindings}${''.padEnd(Math.max(0, 46 - String(report.totalFindings).length))}║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');

    if (report.totalFindings > 0) {
      console.log('║  TOP CRITICAL & HIGH FINDINGS                                ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');

      const topFindings = report.scanResults
        .flatMap((r) => r.findings)
        .filter((f) => f.severity === 'critical' || f.severity === 'high')
        .slice(0, 10);

      for (const f of topFindings) {
        const sev = f.severity === 'critical' ? '🔴' : '🟠';
        console.log(
          `║  ${sev} ${f.title.substring(0, 55).padEnd(55)}║`,
        );
        if (f.file) {
          console.log(
            `║     📄 ${f.file.substring(0, 52).padEnd(52)}║`,
          );
        }
      }
    }

    if (report.recommendations.length > 0) {
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log('║  RECOMMENDATIONS                                             ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      for (const rec of report.recommendations) {
        console.log(
          `║  ${rec.substring(0, 58).padEnd(58)}║`,
        );
      }
    }

    console.log('╚══════════════════════════════════════════════════════════════╝');
  }

  saveJSON(report: DiagnosticReport, filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${filePath}`);
  }

  reportToMarkdown(report: DiagnosticReport, filePath: string): void {
    const md: string[] = [];
    md.push('# 🏥 Platform Diagnostic Report');
    md.push('');
    md.push(`**Date:** ${report.timestamp}`);
    md.push(`**Platform:** ${report.platform} v${report.version}`);
    md.push(`**Overall Score:** ${report.overallScore}/100 (Grade: ${report.overallGrade})`);
    md.push(`**Execution Time:** ${(report.executionTime / 1000).toFixed(1)}s`);
    md.push('');
    md.push('## Scanner Results');
    md.push('');
    md.push('| Scanner | Score | Status | Findings | Duration |');
    md.push('|---------|-------|--------|----------|----------|');

    for (const r of report.scanResults) {
      const status =
        r.status === 'pass'
          ? '✅'
          : r.status === 'warn'
            ? '⚠️'
            : '❌';
      md.push(`| ${r.scanner} | ${r.score}/100 | ${status} | ${r.findings.length} | ${r.duration}ms |`);
    }

    md.push('');
    md.push('## Findings Summary');
    md.push('');
    md.push(`- 🔴 Critical: ${report.criticalCount}`);
    md.push(`- 🟠 High: ${report.highCount}`);
    md.push(`- 🟡 Medium: ${report.mediumCount}`);
    md.push(`- 🔵 Low: ${report.lowCount}`);

    for (const r of report.scanResults) {
      if (r.findings.length === 0) continue;
      md.push('');
      md.push(`### ${r.scanner}`);
      md.push('');
      for (const f of r.findings.slice(0, 20)) { // Limitar a top 20 por scanner para el MD
        const sev = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: '⚪' }[f.severity];
        md.push(`- ${sev} **${f.title}**${f.file ? ` — \`${f.file}${f.line ? ':' + f.line : ''}\`` : ''}`);
        md.push(`  - ${f.suggestion}`);
      }
      if (r.findings.length > 20) {
        md.push(`- ... y ${r.findings.length - 20} hallazgos más en este scanner.`);
      }
    }

    if (report.recommendations.length > 0) {
      md.push('');
      md.push('## Recommendations');
      md.push('');
      for (const rec of report.recommendations) {
        md.push(`- ${rec}`);
      }
    }

    fs.writeFileSync(filePath, md.join('\n'));
    console.log(`📄 Markdown report saved: ${filePath}`);
  }
}
