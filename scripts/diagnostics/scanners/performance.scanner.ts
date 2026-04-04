
import * as fs from 'fs';
import * as path from 'path';
import type { Scanner, ScanResult, Finding } from '../types';

export class PerformanceScanner implements Scanner {
  name = 'performance';
  description = 'Rendimiento y Optimización — N+1, Bundles, Cache';
  weight = 1.1;

  async scan(): Promise<ScanResult> {
    const findings: Finding[] = [];

    // Check 1: N+1 queries en repositories
    findings.push(...this.checkNPlusOneQueries());

    // Check 2: Heavy React components (useEffect con dependencias grandes)
    findings.push(...this.checkHeavyEffects());

    // Check 3: Falta de cache en API routes
    findings.push(...this.checkApiCaching());

    // Check 4: Unoptimized images
    findings.push(...this.checkUnoptimizedImages());

    // Check 5: Barrel imports inefficient
    findings.push(...this.checkBarrelImports());

    const mediumCount = findings.filter(
      (f) => f.severity === 'medium',
    ).length;
    const score = Math.max(0, 100 - findings.length * 4);

    return {
      scanner: this.name,
      status: mediumCount > 10 ? 'warn' : 'pass',
      score: Math.round(score),
      duration: 0,
      findings,
      summary: `${findings.length} sugerencias de optimización`,
    };
  }

  private checkNPlusOneQueries(): Finding[] {
    const findings: Finding[] = [];
    const infraPath = 'src/infrastructure/persistence/supabase/repositories';

    if (!fs.existsSync(infraPath)) return findings;

    const files = fs
      .readdirSync(infraPath)
      .filter((f) => f.endsWith('.ts'));

    for (const file of files) {
      const fullPath = path.join(infraPath, file);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Detectar loops que llaman a repositorios o db
      const loopPatterns = [
        /for\s*\(\s*const\s+\w+\s+of\s+\w+\s*\)\s*\{[^}]*await\s+this\./gms,
        /\.map\s*\(\s*async\s*.*await\s+this\./gms,
        /\.forEach\s*\(\s*async\s*.*await\s+this\./gms,
      ];

      for (const pattern of loopPatterns) {
        if (pattern.test(content)) {
          findings.push({
            id: `nplusone-${file}`,
            scanner: this.name,
            severity: 'high',
            title: 'Potencial N+1 Query detectada',
            description: `Loop async que realiza llamadas individuales a la DB en ${file}`,
            file: fullPath,
            suggestion:
              'Batching: Usar .in() en Supabase o un JOIN para traer todo en una sola query',
            autoFixable: false,
            category: 'db-performance',
          });
        }
      }
    }

    return findings;
  }

  private checkHeavyEffects(): Finding[] {
    const findings: Finding[] = [];
    const componentsFiles = this.getFilesRecursive('src/app');

    for (const file of componentsFiles) {
      if (!file.endsWith('.tsx')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // More accurate detection: useEffect with complex dependencies or missing deps
      // Look for useEffect with async or large dependency arrays
      if (content.includes('useEffect')) {
        const useEffectMatches = content.match(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]{200,}/g);
        if (useEffectMatches && useEffectMatches.length > 2) {
          findings.push({
            id: `heavy-effect-${file}`,
            scanner: this.name,
            severity: 'medium',
            title: 'Componente React con múltiples useEffects complejos',
            description: `Archivo ${path.basename(file)} tiene múltiples useEffects con lógica compleja (>200 chars).`,
            file,
            suggestion:
              'Dividir en componentes más pequeños o extraer lógica a custom hooks con useMemo/useCallback',
            autoFixable: false,
            category: 'react-performance',
          });
        }
      }
    }

    return findings;
  }

  private checkApiCaching(): Finding[] {
    const findings: Finding[] = [];
    const apiPath = 'src/app/api';
    if (!fs.existsSync(apiPath)) return findings;

    const routes = this.getFilesRecursive(apiPath).filter((f) =>
      f.endsWith('route.ts'),
    );

    for (const file of routes) {
      const content = fs.readFileSync(file, 'utf-8');

      if (
        content.includes('export async function GET') &&
        !content.includes('revalidate =') &&
        !content.includes('Cache-Control')
      ) {
        findings.push({
          id: `no-cache-${file}`,
          scanner: this.name,
          severity: 'low',
          title: 'Ruta API GET sin estrategia de cache',
          description: `La ruta ${path.relative(process.cwd(), file)} no define revalidate ni headers de cache`,
          file,
          suggestion: 'Agregar export const revalidate = 60; o similar',
          autoFixable: true,
          category: 'caching',
        });
      }
    }

    return findings;
  }

  private checkUnoptimizedImages(): Finding[] {
    const findings: Finding[] = [];
    const files = this.getFilesRecursive('src/app');

    for (const file of files) {
      if (!file.endsWith('.tsx')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Detectar <img> en vez de <Image> de Next.js
      if (content.includes('<img') && !content.includes('dangerouslySetInnerHTML')) {
        findings.push({
          id: `native-img-${file}`,
          scanner: this.name,
          severity: 'medium',
          title: 'Uso de <img> nativo en vez de next/image',
          description: 'Pierdes optimización automática de tamaño y lazy loading',
          file,
          suggestion: 'Reemplazar <img> con el componente <Image /> de Next.js',
          autoFixable: true,
          category: 'core-web-vitals',
        });
      }
    }

    return findings;
  }

  private checkBarrelImports(): Finding[] {
    const findings: Finding[] = [];
    // Omitido por simplicidad en esta versión
    return findings;
  }

  private getFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next')
          continue;
        files.push(...this.getFilesRecursive(fullPath));
      } else if (
        entry.name.endsWith('.ts') ||
        entry.name.endsWith('.tsx')
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }
}
