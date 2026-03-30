
import { execSync } from 'child_process';
import type { Scanner, ScanResult, Finding, Severity } from '../types';

export class TypeScriptScanner implements Scanner {
  name = 'typescript';
  description = 'Compilación TypeScript — Errores de tipo en todas las capas';
  weight = 1.5; // Peso alto — sin esto no hay deploy

  async scan(): Promise<ScanResult> {
    const findings: Finding[] = [];

    // 1. Ejecutar TSC
    let tscOutput = '';
    try {
      tscOutput = execSync('npx tsc --noEmit --pretty false 2>&1', {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'stdout' in e) {
        tscOutput = (e as { stdout: string }).stdout ?? '';
      }
    }

    // 2. Parsear errores
    const errorLines = tscOutput
      .split('\n')
      .filter((l) => l.includes('error TS'));

    const errorMap = new Map<
      string,
      { count: number; files: Set<string>; sample: string }
    >();

    for (const line of errorLines) {
      if (!line) continue;
      const match = line.match(
        /^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.*)/,
      );
      if (!match) continue;

      const [, file, lineNum, , code, message] = match;
      if (!file || !lineNum || !code || !message) continue;

      if (!errorMap.has(code)) {
        errorMap.set(code, { count: 0, files: new Set(), sample: '' });
      }
      const entry = errorMap.get(code)!;
      entry.count++;
      entry.files.add(file);
      if (!entry.sample) entry.sample = message;

      // Crear finding por cada error (agrupado después)
      findings.push({
        id: `ts-${code}-${file}-${lineNum}`,
        scanner: this.name,
        severity: this.codeSeverity(code),
        title: `${code}: ${message.substring(0, 100)}`,
        description: message,
        file,
        line: parseInt(lineNum),
        suggestion: this.suggestFix(code, message),
        autoFixable: this.isAutoFixable(code),
        category: this.categorizeError(code),
      });
    }

    // 3. Calcular score
    const totalErrors = errorLines.length;
    const score =
      totalErrors === 0
        ? 100
        : Math.max(0, Math.round(100 - totalErrors * 0.5));

    // 4. Metadata de distribución
    const distribution: Record<string, number> = {};
    for (const [code, data] of errorMap) {
      distribution[code] = data.count;
    }

    // 5. Clasificar por directorio
    const byDirectory = new Map<string, number>();
    for (const line of errorLines) {
      if (!line) continue;
      const parts = line.split('(');
      const file = parts[0] ? parts[0].trim() : '';
      if (!file) continue;
      const dir = file
        .split('/')
        .slice(0, -1)
        .join('/');
      byDirectory.set(dir, (byDirectory.get(dir) ?? 0) + 1);
    }

    // 6. Separar producción vs tests
    const prodErrors = errorLines.filter(
      (l) =>
        !l.includes('.test.') &&
        !l.includes('.spec.') &&
        !l.includes('__tests__'),
    ).length;
    const testErrors = totalErrors - prodErrors;

    return {
      scanner: this.name,
      status:
        totalErrors === 0 ? 'pass' : prodErrors > 0 ? 'fail' : 'warn',
      score,
      duration: 0,
      findings,
      summary:
        totalErrors === 0
          ? 'Zero TypeScript errors — Build limpio'
          : `${totalErrors} errores (${prodErrors} producción, ${testErrors} tests)`,
      metadata: {
        totalErrors,
        prodErrors,
        testErrors,
        distribution,
        topDirectories: Object.fromEntries(
          [...byDirectory.entries()]
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10),
        ),
        topErrorTypes: Object.fromEntries(
          [...errorMap.entries()]
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10)
            .map(([code, data]) => [
              code,
              {
                count: data.count,
                affectedFiles: data.files.size,
                sample: data.sample.substring(0, 80),
              },
            ]),
        ),
      },
    };
  }

  private codeSeverity(code: string): Severity {
    const critical = ['TS2304', 'TS2307', 'TS2416', 'TS2420'];
    const high = ['TS2345', 'TS2339', 'TS2322', 'TS18048'];
    const medium = ['TS6133', 'TS2582', 'TS6196'];

    if (critical.includes(code)) return 'critical';
    if (high.includes(code)) return 'high';
    if (medium.includes(code)) return 'medium';
    return 'low';
  }

  private categorizeError(code: string): string {
    const categories: Record<string, string> = {
      TS2304: 'missing-type',
      TS2307: 'missing-module',
      TS2339: 'property-access',
      TS2345: 'type-mismatch',
      TS2322: 'type-assignment',
      TS2416: 'interface-implementation',
      TS2420: 'interface-implementation',
      TS6133: 'unused-code',
      TS6196: 'unused-code',
      TS18048: 'null-safety',
      TS2582: 'test-config',
    };
    return categories[code] ?? 'other';
  }

  private suggestFix(code: string, _message: string): string {
    const suggestions: Record<string, string> = {
      TS2304: 'Agregar import faltante o instalar @types package',
      TS2307: 'Verificar path alias en tsconfig.json o crear barrel export',
      TS2339:
        'Agregar propiedad al tipo, usar optional chaining, o type guard',
      TS2345:
        'Validar con Zod antes de pasar, o usar type assertion seguro',
      TS2322: 'Verificar compatibilidad de tipos en asignación',
      TS6133:
        'Eliminar import/variable no usada o prefijar con _ si es param',
      TS18048: 'Agregar guard clause: if (!x) return ...',
      TS2582: 'Agregar "vitest/globals" a types en tsconfig.json',
    };
    return suggestions[code] ?? `Revisar error ${code} manualmente`;
  }

  private isAutoFixable(code: string): boolean {
    return ['TS6133', 'TS18048', 'TS2582'].includes(code);
  }
}
