// scripts/pds-raw-data.ts
// Ejecutar: npx tsx scripts/pds-raw-data.ts

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function getFilesRecursive(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
    if (!fs.existsSync(dir)) return [];
    let files: string[] = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const res = path.join(dir, e.name);
            if (e.isDirectory()) {
                if (['node_modules', '.next', '.git'].includes(e.name)) continue;
                files = files.concat(getFilesRecursive(res, ext));
            } else {
                if (ext.some(x => e.name.endsWith(x))) {
                    files.push(res);
                }
            }
        }
    } catch (err) {
        // Silently ignore access errors
    }
    return files;
}

async function main() {
    const report: string[] = [];
    report.push('# PDS Raw Data — Diagnóstico Exhaustivo');
    report.push(`Generado: ${new Date().toISOString()}`);
    report.push('');

    // ═══ TSC ═══
    console.log('🔍 Running TSC...');
    let tscOutput = '';
    try {
        tscOutput = execSync('npx tsc --noEmit --pretty false 2>&1', {
            encoding: 'utf-8',
            maxBuffer: 100 * 1024 * 1024,
        });
    } catch (e: any) {
        tscOutput = (e.stdout || '') + (e.stderr || '');
    }

    const errorLines = tscOutput.split('\n').filter(l => l.includes('error TS'));

    // 1. Por tipo
    const codes: Record<string, number> = {};
    errorLines.forEach(l => {
        const m = l.match(/error (TS\d+):/);
        if (m && m[1]) {
            const code = m[1];
            codes[code] = (codes[code] || 0) + 1;
        }
    });

    report.push('## 1. TSC — POR TIPO DE ERROR');
    Object.entries(codes).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        report.push(`- **${k}**: ${v}`);
    });
    report.push('');

    // 2. Top 25 archivos
    const fileErrors: Record<string, number> = {};
    errorLines.forEach(l => {
        const parts = l.split('(');
        const f = parts[0] ? parts[0].trim() : '';
        if (f) fileErrors[f] = (fileErrors[f] || 0) + 1;
    });

    // 5. Clasificar por directorio
    const byDirectory = new Map<string, number>();
    for (const line of errorLines) {
      const parts = line.split('(');
      const file = parts[0] ? parts[0].trim() : '';
      if (!file) continue;
      const dir = file
        .split('/')
        .slice(0, -1)
        .join('/');
      byDirectory.set(dir, (byDirectory.get(dir) ?? 0) + 1);
    }

    report.push('## 2. TSC — TOP 25 ARCHIVOS');
    Object.entries(fileErrors).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => {
        report.push(`- ${v} errors: \`${k}\``);
    });
    report.push('');

    // 3. Primeros 60 errores
    report.push('## 3. TSC — PRIMEROS 60 ERRORES');
    report.push('```text');
    errorLines.slice(0, 60).forEach(l => report.push(l));
    report.push('```');
    report.push('');

    // 4. Producción vs Tests
    report.push('## 4. PRODUCCIÓN vs TESTS');
    const prodErrors = errorLines.filter(l =>
        !l.includes('.test.') && !l.includes('.spec.') && !l.includes('__tests__')
    ).length;
    report.push(`- Producción: **${prodErrors}**`);
    report.push(`- Tests: **${errorLines.length - prodErrors}**`);
    report.push('');

    // 5. Por directorio
    report.push('## 5. ERRORES POR DIRECTORIO');
    const dirs: Record<string, number> = {};
    errorLines.forEach(l => {
        const partsPrefix = l.split('(');
        const f = partsPrefix[0] ? partsPrefix[0].trim() : '';
        if (!f) return;
        const parts = f.split(path.sep);
        const dir = parts.slice(0, Math.min(4, parts.length - 1)).join('/');
        if (dir) dirs[dir] = (dirs[dir] || 0) + 1;
    });
    Object.entries(dirs).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
        report.push(`- ${v} errors: \`${k}\``);
    });
    report.push('');

    // 6. TS2339 detalle
    report.push('## 6. TS2339 — PROPIEDADES INEXISTENTES');
    const ts2339 = errorLines.filter(l => l.includes('TS2339'));
    const propCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    ts2339.forEach(l => {
        const propMatch = l.match(/Property '(\w+)'/);
        const typeMatch = l.match(/on type '([^']+)'/);
        if (propMatch && propMatch[1]) {
            const prop = propMatch[1];
            propCounts[prop] = (propCounts[prop] || 0) + 1;
        }
        if (typeMatch && typeMatch[1]) {
            const type = typeMatch[1];
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    });
    report.push('### Propiedades:');
    Object.entries(propCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
        report.push(`- \`${k}\`: ${v}x`);
    });
    report.push('### Tipos afectados:');
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
        report.push(`- \`${k}\`: ${v}x`);
    });
    report.push('');

    // 7. TS2307 detalle
    report.push('## 7. TS2307 — MÓDULOS NO ENCONTRADOS');
    const ts2307 = errorLines.filter(l => l.includes('TS2307'));
    const moduleCounts: Record<string, number> = {};
    ts2307.forEach(l => {
        const m = l.match(/Cannot find module '([^']+)'/);
        if (m && m[1]) {
            const mod = m[1];
            moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
        }
    });
    Object.entries(moduleCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
        report.push(`- \`${k}\`: ${v}x`);
    });
    report.push('');

    // 8. Seguridad
    report.push('## 8. SEGURIDAD — RUTAS SIN AUTH');
    const apiDir = 'src/app/api';
    if (fs.existsSync(apiDir)) {
        const routes = getFilesRecursive(apiDir).filter(f =>
            f.endsWith('route.ts') || f.endsWith('route.tsx')
        );
        let unprotected = 0;
        routes.forEach(f => {
            const content = fs.readFileSync(f, 'utf-8');
            const hasAuth = /getServerSession|auth\(|getSession|requireAdmin|requireAuth|getUser|withAuth|withAdmin|cookies\(\)/.test(content);
            const methods = Array.from(content.matchAll(/export.*function (GET|POST|PUT|DELETE|PATCH)/g)).map(m => m[1]);
            if (!hasAuth && methods.length > 0) {
                report.push(`- ❌ \`${f}\` [${methods.join(', ')}]`);
                unprotected++;
            }
        });
        report.push(`\n**Total sin auth: ${unprotected}/${routes.length}**`);
    }
    report.push('');

    // 9. Infrastructure
    report.push('## 9. INFRAESTRUCTURA');
    const infraDir = 'src/infrastructure';

    // 9a. Throw en infrastructure
    report.push('### Throws:');
    if (fs.existsSync(infraDir)) {
        const infraFiles = getFilesRecursive(infraDir, ['.ts']).filter(f => !f.includes('.test.'));
        infraFiles.forEach(f => {
            const content = fs.readFileSync(f, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (/throw\s+new\s/.test(l) && !l.trim().startsWith('//')) {
                    report.push(`- \`${f}:${i + 1}\`: \`${l.trim().substring(0, 80)}\``);
                }
            });
        });
    }
    report.push('');

    // 9b. Promesas no awaited
    report.push('### Promesas no awaited:');
    if (fs.existsSync(infraDir)) {
        const infraFiles = getFilesRecursive(infraDir, ['.ts']).filter(f => !f.includes('.test.'));
        let count = 0;
        infraFiles.forEach(f => {
            if (count >= 20) return;
            const content = fs.readFileSync(f, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (count >= 20) return;
                if (/supabase\.|\.from\(/.test(l) && !/await|\/\/|import|type |interface /.test(l)) {
                    report.push(`- \`${f}:${i + 1}\`: \`${l.trim().substring(0, 80)}\``);
                    count++;
                }
            });
        });
    }
    report.push('');

    // 10. Performance
    report.push('## 10. PERFORMANCE');
    report.push('### use client innecesarios:');
    const tsxFiles = getFilesRecursive('src', ['.tsx']);
    tsxFiles.forEach(f => {
        const content = fs.readFileSync(f, 'utf-8');
        if (/'use client'|"use client"/.test(content)) {
            const hasHooks = /useState|useEffect|useRef|useCallback|useMemo|useReducer|onClick|onChange|onSubmit|onBlur/.test(content);
            if (!hasHooks) {
                report.push(`- ⚠️ \`${f}\``);
            }
        }
    });
    report.push('');

    // 11. as any en domain
    report.push('## 11. AS ANY EN DOMAIN/APPLICATION');
    ['src/core/domain', 'src/core/application'].forEach(dir => {
        const domainFiles = getFilesRecursive(dir, ['.ts']).filter(f => !f.includes('.test.'));
        domainFiles.forEach(f => {
            const content = fs.readFileSync(f, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (/as any/.test(l) && !l.trim().startsWith('//')) {
                    report.push(`- \`${f}:${i + 1}\`: \`${l.trim().substring(0, 80)}\``);
                }
            });
        });
    });
    report.push('');

    // TOTAL
    report.push('---');
    report.push(`**TOTAL TSC ERRORS: ${errorLines.length}**`);
    report.push(`**Generado: ${new Date().toISOString()}**`);

    // Write
    const outputPath = 'pds_raw_data.md';
    fs.writeFileSync(outputPath, report.join('\n'));
    console.log(`\n✅ Reporte generado: ${outputPath}`);
    console.log(`📊 Total errores TSC: ${errorLines.length}`);
    console.log(`\n📋 Copiar contenido: cat ${outputPath}`);
}

main();
