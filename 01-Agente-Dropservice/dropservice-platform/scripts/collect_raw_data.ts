
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const report: string[] = [];
    report.push('# PDS Raw Data (CRUDE)');
    report.push('');

    // --- 1/6 TSC Stats ---
    console.log('Running TSC...');
    let tscOutput = '';
    try {
        tscOutput = execSync('npx tsc --noEmit --pretty false', { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
    } catch (e: any) {
        tscOutput = e.stdout || e.stderr || '';
    }

    const errorLines = tscOutput.split('\n').filter(l => l.includes('error TS'));
    
    // Group by code
    const codes: Record<string, number> = {};
    errorLines.forEach(l => {
        const m = l.match(/error (TS\d+):/);
        if (m && m[1]) codes[m[1]] = (codes[m[1]] || 0) + 1;
    });
    
    report.push('## 1. TSC — POR TIPO DE ERROR');
    Object.entries(codes).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
        report.push(`- **${k}**: ${v}`);
    });
    report.push('');

    // Top 25 Files
    const files: Record<string, number> = {};
    errorLines.forEach(l => {
        const parts = l.split('(');
        const f = parts[0] ? parts[0].trim() : '';
        if (f) files[f] = (files[f] || 0) + 1;
    });

    report.push('## 2. TSC — TOP 25 ARCHIVOS');
    Object.entries(files).sort((a,b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => {
        report.push(`- ${v} errors: \`${k}\``);
    });
    report.push('');

    // First 60 full errors
    report.push('## 3. TSC — PRIMEROS 60 ERRORES COMPLETOS');
    report.push('```text');
    errorLines.slice(0, 60).forEach(l => report.push(l));
    report.push('```');
    report.push('');

    // --- 4/6 Security ---
    report.push('## 4. SEGURIDAD — RUTAS API SIN AUTH');
    const apiDir = 'src/app/api';
    if (fs.existsSync(apiDir)) {
        const getFiles = (dir: string): string[] => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            return entries.flatMap(e => {
                const res = path.join(dir, e.name);
                return e.isDirectory() ? getFiles(res) : res;
            });
        };

        const routes = getFiles(apiDir).filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));
        routes.forEach(f => {
            const content = fs.readFileSync(f, 'utf-8');
            const hasAuth = /getServerSession|auth\(|getSession|requireAdmin|requireAuth|getUser|cookies\(\)/.test(content);
            const methods = Array.from(content.matchAll(/export.*function (GET|POST|PUT|DELETE|PATCH)/g)).map(m => m[1]);
            if (!hasAuth && methods.length > 0) {
                report.push(`- ❌ \`${f}\` [${methods.join(', ')}]`);
            }
        });
    }
    report.push('');

    // --- 5/6 Infrastructure ---
    report.push('## 5. INFRAESTRUCTURA — PROMESAS NO AWAITED');
    const infraDir = 'src/infrastructure';
    if (fs.existsSync(infraDir)) {
        const getFiles = (dir: string): string[] => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            return entries.flatMap(e => {
                const res = path.join(dir, e.name);
                return e.isDirectory() ? getFiles(res) : res;
            });
        };

        const infraFiles = getFiles(infraDir).filter(f => f.endsWith('.ts') && !f.includes('.test.'));
        let infraCount = 0;
        infraFiles.forEach(f => {
            if (infraCount >= 20) return;
            const content = fs.readFileSync(f, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((l, i) => {
                if (infraCount >= 20) return;
                if (/supabase\.|\.from\(/.test(l) && !/await|\/\//.test(l)) {
                    report.push(`- \`${f}:${i+1}\`: \`${l.trim()}\``);
                    infraCount++;
                }
            });
        });
    }
    report.push('');

    // --- 6/6 Performance ---
    report.push('## 6. PERFORMANCE — USE CLIENT INNECESARIOS');
    const srcDir = 'src';
    const getAllTsx = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.flatMap(e => {
            const res = path.join(dir, e.name);
            if (e.isDirectory()) {
                if (e.name === 'node_modules' || e.name === '.next') return [];
                return getAllTsx(res);
            }
            return e.name.endsWith('.tsx') ? res : [];
        });
    };

    const tsxFiles = getAllTsx(srcDir);
    tsxFiles.forEach(f => {
        const content = fs.readFileSync(f, 'utf-8');
        if (/'use client'|"use client"/.test(content)) {
            const hasHooks = /useState|useEffect|useRef|useCallback|onClick|onChange|onSubmit/.test(content);
            if (!hasHooks) {
                report.push(`- ⚠️ \`${f}\` (use client sin hooks)`);
            }
        }
    });

    report.push('');
    report.push(`**TOTAL TSC ERRORS: ${errorLines.length}**`);

    fs.writeFileSync('pds_raw_data.md', report.join('\n'));
    console.log('Report generated: pds_raw_data.md');
}

main();
