import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runBaseline() {
  console.log('--- Generando Baseline Phase 2 ---');
  let output = `Baseline - ${new Date().toISOString()}\n\n`;

  // 1. Errores TSC
  try {
    console.log('Contando errores TSC...');
    let tscOutput = '';
    try {
      tscOutput = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    } catch (e: any) {
      tscOutput = e.stdout || '';
    }
    const errors = (tscOutput || '').split('\n').filter((line: string) => line.includes('error TS')).length;
    output += `Errores TSC Totales: ${errors}\n`;
  } catch (e: any) {
    const errors = (e.stdout || '').split('\n').filter((line: string) => line.includes('error TS')).length;
    output += `Errores TSC Totales: ${errors}\n`;
  }

  // 2. Imports UI
  console.log('Mapeando imports UI...');
  const files = getAllFiles('src');
  const quotationImports = files.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    return /from.*QuotationsTable/.test(content);
  });
  const orderImports = files.filter(f => {
    const content = fs.readFileSync(f, 'utf8');
    return /from.*OrdersTable/.test(content);
  });

  output += `\nArchivos que importan Quotation de UI: ${quotationImports.length}\n`;
  quotationImports.forEach(f => output += `  - ${f}\n`);

  output += `\nArchivos que importan Order de UI: ${orderImports.length}\n`;
  orderImports.forEach(f => output += `  - ${f}\n`);

  // 3. Throws en Infra
  console.log('Contando throws en infra...');
  const infraFiles = getAllFiles('src/infrastructure');
  let throwCount = 0;
  infraFiles.forEach(f => {
      if (f.includes('.test.')) return;
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.match(/throw new/g);
      if (matches) throwCount += matches.length;
  });
  output += `\nThrows en Infrastructure: ${throwCount}\n`;

  fs.writeFileSync('phase2-baseline.txt', output);
  console.log('✅ Baseline guardado en phase2-baseline.txt');
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

runBaseline();
