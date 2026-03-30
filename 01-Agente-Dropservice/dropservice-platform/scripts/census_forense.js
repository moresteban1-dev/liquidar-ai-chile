const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("╔══════════════════════════════════════════╗");
console.log("║  CENSO FORENSE — OPERACIÓN ZERO         ║");
console.log("╚══════════════════════════════════════════╝");

let tscOutput = "";
try {
    // We use a large buffer because 247 errors + context can be big
    tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
} catch (e) {
    tscOutput = e.stdout || e.stderr || "";
}

const errorLines = tscOutput.split('\n').filter(line => line.includes('error TS'));
const totalErrors = errorLines.length;

// 1. POR TIPO DE ERROR
console.log("\n═══ 1. POR TIPO DE ERROR ═══");
const types = {};
errorLines.forEach(line => {
    const match = line.match(/error TS(\d+):/);
    if (match) {
        const type = `TS${match[1]}`;
        types[type] = (types[type] || 0) + 1;
    }
});
Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`${String(count).padStart(5)} ${type}`);
});

// 2. POR DIRECTORIO
console.log("\n═══ 2. POR DIRECTORIO ═══");
const dirs = {};
errorLines.forEach(line => {
    const match = line.match(/^([^(]+)\(/);
    if (match) {
        const filePath = match[1].trim();
        const dir = path.dirname(filePath);
        dirs[dir] = (dirs[dir] || 0) + 1;
    }
});
Object.entries(dirs).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([dir, count]) => {
    console.log(`${String(count).padStart(5)} ${dir}`);
});

// 3. TOP 20 ARCHIVOS
console.log("\n═══ 3. TOP 20 ARCHIVOS CON MÁS ERRORES ═══");
const files = {};
errorLines.forEach(line => {
    const match = line.match(/^([^(]+)\(/);
    if (match) {
        const filePath = match[1].trim();
        files[filePath] = (files[filePath] || 0) + 1;
    }
});
Object.entries(files).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([file, count]) => {
    console.log(`${String(count).padStart(5)} ${file}`);
});

// 4. PRODUCCIÓN vs TESTS
console.log("\n═══ 4. PRODUCCIÓN vs TESTS ═══");
let prodCount = 0;
let testCount = 0;
const testRegex = /\.test\.|\.spec\.|__tests__|[\\/]tests[\\/]/;
errorLines.forEach(line => {
    if (testRegex.test(line)) {
        testCount++;
    } else {
        prodCount++;
    }
});
console.log(`Producción: ${prodCount}`);
console.log(`Tests:      ${testCount}`);

// Detalle específico para TS6133, TS2304, TS2339
const detail = (typeCode, label) => {
    console.log(`\n═══ ${label} — ${typeCode} (detalle) ═══`);
    const items = {};
    errorLines.filter(l => l.includes(typeCode)).forEach(line => {
        let nameMatch;
        if (typeCode === 'TS6133') nameMatch = line.match(/'([^']+)'/);
        if (typeCode === 'TS2304') nameMatch = line.match(/Cannot find name '([^']+)'/);
        if (typeCode === 'TS2339') nameMatch = line.match(/Property '([^']+)'/);
        
        if (nameMatch) {
            const name = nameMatch[1];
            items[name] = (items[name] || 0) + 1;
        }
    });
    Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([name, count]) => {
        console.log(`${String(count).padStart(5)} ${name}`);
    });
};

detail('TS6133', 'VARIABLES NO USADAS');
detail('TS2304', 'NOMBRES NO ENCONTRADOS');
detail('TS2339', 'PROPIEDADES INEXISTENTES');

console.log("\n═══ 8. ERRORES COMPLETOS (head 80) ═══");
errorLines.slice(0, 80).forEach(l => console.log(l));

console.log("\n═══ 9. TOTAL CONFIRMADO ═══");
console.log(`Total: ${totalErrors}`);

fs.writeFileSync('scripts/census_output.txt', tscOutput);
fs.writeFileSync('scripts/census_summary.txt', JSON.stringify({ types, dirs, files, prodCount, testCount, totalErrors }, null, 2));
