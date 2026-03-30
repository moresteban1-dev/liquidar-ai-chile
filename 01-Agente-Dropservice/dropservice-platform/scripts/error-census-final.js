import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('tsc_output.txt', 'utf8');
const lines = content.split('\n');
const errorLines = lines.filter(l => l.includes('error TS'));

console.log('╔══════════════════════════════════════════╗');
console.log('║  CENSO FORENSE — ' + errorLines.length + ' ERRORES RESTANTES  ║');
console.log('╚══════════════════════════════════════════╝');

const typeCounts = {};
const dirCounts = {};
const fileCounts = {};
let prodCount = 0;
let testCount = 0;

errorLines.forEach(line => {
  // Type count
  const typeMatch = line.match(/error TS(\d+)/);
  if (typeMatch) {
    const type = 'TS' + typeMatch[1];
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Path processing
  const pathPart = line.split('(')[0].trim();
  if (pathPart) {
    fileCounts[pathPart] = (fileCounts[pathPart] || 0) + 1;
    const dir = path.dirname(pathPart);
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;

    if (pathPart.match(/\.test\.|\.spec\.\|__tests__\|/tests\//)) {
      testCount++;
    } else {
      prodCount++;
    }
  }
});

console.log('\n═══ 1. POR TIPO DE ERROR ═══');
Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => console.log(`${count.toString().padStart(5)} | ${type}`));

console.log('\n═══ 2. POR DIRECTORIO ═══');
Object.entries(dirCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([dir, count]) => console.log(`${count.toString().padStart(5)} | ${dir}`));

console.log('\n═══ 3. TOP 20 ARCHIVOS CON MÁS ERRORES ═══');
Object.entries(fileCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([file, count]) => console.log(`${count.toString().padStart(5)} | ${file}`));

console.log('\n═══ 4. PRODUCCIÓN vs TESTS ═══');
console.log(`Producción: ${prodCount}`);
console.log(`Tests:      ${testCount}`);

console.log('\n═══ 9. TOTAL CONFIRMADO ═══');
console.log(`Total: ${errorLines.length}`);
