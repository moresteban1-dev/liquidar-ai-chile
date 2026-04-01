const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏁 Iniciando Radiografía Forense (Final Push)...');

try {
  const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  processOutput(output);
} catch (error) {
  if (error.stdout) {
    processOutput(error.stdout);
  } else {
    console.error('Error al ejecutar tsc:', error.message);
  }
}

function processOutput(output) {
  const lines = output.split('\n');
  const errorLines = lines.filter(l => l.includes('error TS'));
  
  // 1. Censo por tipo de error
  const typeCensus = {};
  errorLines.forEach(l => {
    const match = l.match(/error TS(\d+):/);
    if (match) {
      const type = `TS${match[1]}`;
      typeCensus[type] = (typeCensus[type] || 0) + 1;
    }
  });
  
  const sortedTypes = Object.entries(typeCensus).sort((a, b) => b[1] - a[1]);
  fs.writeFileSync('tsc_type_census.txt', sortedTypes.map(([t, c]) => `${c.toString().padStart(6)} | ${t}`).join('\n'));
  
  // 2. Censo por DIRECTORIO
  const dirCensus = {};
  errorLines.forEach(l => {
    const match = l.match(/^(.+?)\(/);
    if (match) {
      const dir = path.dirname(match[1]);
      dirCensus[dir] = (dirCensus[dir] || 0) + 1;
    }
  });
  
  const sortedDirs = Object.entries(dirCensus).sort((a, b) => b[1] - a[1]).slice(0, 20);
  fs.writeFileSync('tsc_dir_census.txt', sortedDirs.map(([d, c]) => `${c.toString().padStart(6)} | ${d}`).join('\n'));
  
  // 3. Los 15 ARCHIVOS con más errores
  const fileCensus = {};
  errorLines.forEach(l => {
    const match = l.match(/^(.+?)\(/);
    if (match) {
      const file = match[1];
      fileCensus[file] = (fileCensus[file] || 0) + 1;
    }
  });
  
  const sortedFiles = Object.entries(fileCensus).sort((a, b) => b[1] - a[1]).slice(0, 15);
  fs.writeFileSync('tsc_file_census.txt', sortedFiles.map(([f, c]) => `${c.toString().padStart(6)} | ${f}`).join('\n'));
  
  // 4. Separar producción vs tests
  let prodCount = 0;
  let testCount = 0;
  
  errorLines.forEach(l => {
    if (l.match(/\.test\.|\.spec\.|__tests__|tests\//)) {
      testCount++;
    } else {
      prodCount++;
    }
  });
  
  fs.writeFileSync('tsc_prod_vs_test.txt', `=== PRODUCCIÓN ===\n${prodCount}\n=== TESTS ===\n${testCount}\n`);
  
  console.log('\n✅ Radiografía completada. Resultados guardados en archivos tsc_*.txt');
}
