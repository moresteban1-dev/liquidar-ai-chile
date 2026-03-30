import * as fs from 'fs';
import * as path from 'path';

try {
    const content = fs.readFileSync('tsc_output.txt', 'utf8');
    const lines = content.split('\n');
    const errorLines = lines.filter(l => l.includes('error TS'));

    let output = '';
    output += '╔══════════════════════════════════════════╗\n';
    output += `║  CENSO FORENSE — ${errorLines.length} ERRORES RESTANTES  ║\n`;
    output += '╚══════════════════════════════════════════╝\n';

    const typeCounts: Record<string, number> = {};
    const dirCounts: Record<string, number> = {};
    const fileCounts: Record<string, number> = {};
    let prodCount = 0;
    let testCount = 0;

    errorLines.forEach(line => {
        const typeMatch = line.match(/error TS(\d+)/);
        if (typeMatch) {
            const type = 'TS' + typeMatch[1];
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }

        const splitLine = line.split('(');
        const firstPart = splitLine[0];
        const pathPart = firstPart ? firstPart.trim() : '';
        if (pathPart) {
            fileCounts[pathPart] = (fileCounts[pathPart] || 0) + 1;
            const dir = path.dirname(pathPart);
            dirCounts[dir] = (dirCounts[dir] || 0) + 1;

            if (pathPart.match(/\.test\.|\.spec\.|__tests__|[\\/]tests[\\/]/)) {
                testCount++;
            } else {
                prodCount++;
            }
        }
    });

    output += '\n═══ 1. POR TIPO DE ERROR ═══\n';
    Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => output += `${count.toString().padStart(5)} | ${type}\n`);

    output += '\n═══ 2. POR DIRECTORIO ═══\n';
    Object.entries(dirCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .forEach(([dir, count]) => output += `${count.toString().padStart(5)} | ${dir}\n`);

    output += '\n═══ 3. TOP 20 ARCHIVOS CON MÁS ERRORES ═══\n';
    Object.entries(fileCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([file, count]) => output += `${count.toString().padStart(5)} | ${file}\n`);

    output += '\n═══ 4. PRODUCCIÓN vs TESTS ═══\n';
    output += `Producción: ${prodCount}\n`;
    output += `Tests:      ${testCount}\n`;

    output += '\n═══ 9. TOTAL CONFIRMADO ═══\n';
    output += `Total: ${errorLines.length}\n`;

    fs.writeFileSync('final_census_report.txt', output, 'utf8');
    console.log('Reporte generado en final_census_report.txt');

} catch (err) {
    console.error('Error al procesar el censo:', err);
    process.exit(1);
}
