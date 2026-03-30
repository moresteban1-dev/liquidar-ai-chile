const { spawn } = require('child_process');

console.log('🚀 Iniciando Censo de Errores (Health Audit)...');

const tsc = spawn('npx', ['tsc', '--noEmit'], { shell: true });

let output = '';

tsc.stdout.on('data', (data) => {
  output += data.toString();
});

tsc.stderr.on('data', (data) => {
  output += data.toString();
});

tsc.on('close', (code) => {
  const lines = output.split('\n');
  const errorMap = {};
  let totalErrors = 0;

  lines.forEach(line => {
    const match = line.match(/error TS(\d+):/);
    if (match) {
      const errorCode = `TS${match[1]}`;
      errorMap[errorCode] = (errorMap[errorCode] || 0) + 1;
      totalErrors++;
    }
  });

  console.log('\n📊 RESULTADOS DEL CENSO:');
  console.log('------------------------');
  
  if (totalErrors === 0) {
    console.log('✅ ¡SALUD TOTAL! - Cero errores de TypeScript detectados.');
  } else {
    Object.entries(errorMap)
      .sort((a, b) => b[1] - a[1])
      .forEach(([code, count]) => {
        console.log(`${count.toString().padEnd(5)} | ${code}`);
      });
    console.log('------------------------');
    console.log(`TOTAL: ${totalErrors} errores.`);
  }
});
