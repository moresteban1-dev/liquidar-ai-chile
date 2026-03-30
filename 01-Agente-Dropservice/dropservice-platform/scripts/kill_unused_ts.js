/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🧹 OPERACIÓN ZERO — Eliminando TS6133 (Variables e Imports)...");

// 1. Obtener todos los errores TS6133
let output = "";
try {
    output = execSync('npx tsc --noEmit', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
    output = e.stdout || e.stderr || "";
}

const lines = output.split('\n');
const unusedVars = [];

for (const line of lines) {
    if (line.includes('TS6133')) {
        const fileMatch = line.match(/^(.+?)\((\d+),(\d+)\)/);
        const nameMatch = line.match(/'([^']+)'/);
        if (fileMatch && nameMatch) {
            unusedVars.push({
                file: fileMatch[1],
                line: parseInt(fileMatch[2]),
                col: parseInt(fileMatch[3]),
                varName: nameMatch[1],
                raw: line
            });
        }
    }
}

console.log(`\n📊 Total TS6133 encontrados: ${unusedVars.length}\n`);

// 2. Agrupar por archivo
const byFile = new Map();
for (const err of unusedVars) {
    if (!byFile.has(err.file)) byFile.set(err.file, []);
    byFile.get(err.file).push(err);
}

// 3. Procesar cada archivo
let fixed = 0;
let manual = 0;

for (const [file, fileErrors] of byFile) {
    const absolutePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if (!fs.existsSync(absolutePath)) continue;

    let contentRows = fs.readFileSync(absolutePath, 'utf-8').split('\n');
    let modified = false;

    // Sort errors by line descending to avoid index shifts if we delete lines
    const sortedErrors = fileErrors.sort((a, b) => b.line - a.line);

    for (const err of sortedErrors) {
        const lineIdx = err.line - 1;
        const lineContent = contentRows[lineIdx];
        if (!lineContent) continue;

        // --- CASO 1: Catch blocks ---
        if (lineContent.includes(`catch (${err.varName})`)) {
            contentRows[lineIdx] = lineContent.replace(`catch (${err.varName})`, `catch (_${err.varName})`);
            modified = true;
            fixed++;
            console.log(`  ✅ ${file}:${err.line} — Catch block: ${err.varName} -> _${err.varName}`);
            continue;
        }

        // --- CASO 2: Unused Import Completo ---
        // import { Unused } from '...'
        const singleImportRegex = new RegExp(`^import\\s*\\{\\s*${err.varName}\\s*\\}\\s*from\\s*['"].*['"];?\\s*$`);
        if (singleImportRegex.test(lineContent.trim())) {
            contentRows[lineIdx] = `// [REMOVED] ${lineContent.trim()}`;
            modified = true;
            fixed++;
            console.log(`  🗑️  ${file}:${err.line} — Removed unused import: ${err.varName}`);
            continue;
        }

        // --- CASO 3: Parte de un import múltiple ---
        // import { Used, Unused } from '...'
        if (lineContent.includes('import') && lineContent.includes(err.varName)) {
            // Regex to match the variable and its surrounding comma/whitespace
            const multiImportRegex = new RegExp(`,\\s*${err.varName}\\s*(?=,|\\})|${err.varName}\\s*,\\s*`);
            const newLine = lineContent.replace(multiImportRegex, '');
            if (newLine !== lineContent) {
                contentRows[lineIdx] = newLine;
                modified = true;
                fixed++;
                console.log(`  ✂️  ${file}:${err.line} — Removed '${err.varName}' from multi-import`);
                continue;
            }
        }

        // --- CASO 4: Parámetro de función ---
        // Prefix with _
        const paramRegex = new RegExp(`\\b${err.varName}\\b`);
        // Check if it's likely a parameter: in a function, arrow, or has type colon
        if (paramRegex.test(lineContent) && (lineContent.includes('=>') || lineContent.includes('function') || lineContent.includes(': '))) {
            contentRows[lineIdx] = lineContent.replace(new RegExp(`\\b${err.varName}\\b`), `_${err.varName}`);
            modified = true;
            fixed++;
            console.log(`  📝 ${file}:${err.line} — Prefixed: ${err.varName} → _${err.varName}`);
            continue;
        }

        manual++;
        console.log(`  ❓ ${file}:${err.line} — MANUAL: '${err.varName}'`);
    }

    if (modified) {
        fs.writeFileSync(absolutePath, contentRows.join('\n'));
    }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Resultados Finales:`);
console.log(`   ✅ Auto-fixed: ${fixed}`);
console.log(`   ❓ Manuales:   ${manual}`);
console.log(`\nVerifique con: npx tsc --noEmit | grep TS6133 | wc -l`);
