import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface UnusedVar {
  file: string;
  line: number;
  col: number;
  varName: string;
}

try {
  // 1. Obtener todos los TS6133 desde el archivo de salida previo (o correr tsc de nuevo)
  const output = fs.readFileSync('tsc_output.txt', 'utf-8');

  const errors: UnusedVar[] = output
    .split('\n')
    .filter((l) => l.includes('TS6133'))
    .map((line) => {
      const fileMatch = line.match(/^(.+?)\((\d+),(\d+)\)/);
      const nameMatch = line.match(/'(\w+)'/);
      if (!fileMatch || !nameMatch) return null;
      return {
        file: fileMatch[1],
        line: parseInt(fileMatch[2]),
        col: parseInt(fileMatch[3]),
        varName: nameMatch[1],
      };
    })
    .filter((e): e is UnusedVar => e !== null);

  console.log(`\n📊 Total TS6133 iniciales: ${errors.length}\n`);

  // 2. Agrupar por archivo
  const byFile = new Map<string, UnusedVar[]>();
  for (const err of errors) {
    if (!byFile.has(err.file)) byFile.set(err.file, []);
    byFile.get(err.file)!.push(err);
  }

  // 3. Procesar cada archivo
  let fixed = 0;
  let manual = 0;

  for (const [file, fileErrors] of byFile) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Ordenar errores de abajo hacia arriba para no romper los índices
    const sortedErrors = [...fileErrors].sort((a, b) => b.line - a.line);

    for (const err of sortedErrors) {
      const lineIdx = err.line - 1;
      const lineContent = lines[lineIdx];
      if (!lineContent) continue;

      // Caso 1: Es un catch (error) -> catch (_error)
      if (lineContent.includes(`catch (${err.varName})`)) {
        lines[lineIdx] = lineContent.replace(`catch (${err.varName})`, `catch (_${err.varName})`);
        modified = true;
        fixed++;
        console.log(`  📝 ${file}:${err.line} — Catch prefixed: ${err.varName} -> _${err.varName}`);
        continue;
      }

      // Caso 2: Es un import completo no usado
      const singleImportRegex = new RegExp(`^import\\s*\\{\\s*${err.varName}\\s*\\}\\s*from\\s*['"].*['"];?\\s*$`);
      if (singleImportRegex.test(lineContent.trim())) {
        lines[lineIdx] = `// [REMOVED] ${lineContent[lineIdx]}`; // Comentar en lugar de borrar para seguridad
        modified = true;
        fixed++;
        console.log(`  🗑️  ${file}:${err.line} — Commented unused import: ${err.varName}`);
        continue;
      }

      // Caso 3: Es un parámetro de función -> prefijar con _
      // Solo si parece una definición de función
      if (lineContent.includes('=>') || lineContent.includes('function') || lineContent.includes(') {')) {
        const paramRegex = new RegExp(`\\b${err.varName}\\b`);
        lines[lineIdx] = lineContent.replace(paramRegex, `_${err.varName}`);
        modified = true;
        fixed++;
        console.log(`  📝 ${file}:${err.line} — Param prefixed: ${err.varName} -> _${err.varName}`);
        continue;
      }

      manual++;
      console.log(`  ❓ ${file}:${err.line} — MANUAL: '${err.varName}' en "${lineContent.trim().substring(0, 40)}..."`);
    }

    if (modified) {
      fs.writeFileSync(fullPath, lines.join('\n'));
    }
  }

  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`📊 Resultados del saneamiento:`);
  console.log(`   ✅ Saneados automáticamente: ${fixed}`);
  console.log(`   ❓ Requieren intervención manual: ${manual}`);
  console.log(`════════════════════════════════════════════════════\n`);

} catch (err) {
  console.error('Error durante el saneamiento:', err);
  process.exit(1);
}
