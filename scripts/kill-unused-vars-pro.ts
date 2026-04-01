import * as fs from 'fs';
import * as path from 'path';

interface UnusedVar {
  file: string;
  line: number;
  col: number;
  varName: string;
}

try {
  const output = fs.readFileSync('tsc_output.txt', 'utf-8');

  const errors: UnusedVar[] = output
    .split('\n')
    .filter((l) => l.includes('TS6133'))
    .map((line) => {
      const fileMatch = line.match(/^(.+?)\((\d+),(\d+)\)/);
      const nameMatch = line.match(/'(\w+)'/);
      if (!fileMatch || !nameMatch) return null;
      return {
        file: fileMatch[1] ?? '',
        line: parseInt(fileMatch[2] ?? '0'),
        col: parseInt(fileMatch[3] ?? '0'),
        varName: nameMatch[1] ?? '',
      };
    })
    .filter((e): e is UnusedVar => e !== null);

  console.log(`\n📊 Total TS6133 detectados: ${errors.length}\n`);

  const byFile = new Map<string, UnusedVar[]>();
  for (const err of errors) {
    if (!byFile.has(err.file)) byFile.set(err.file, []);
    byFile.get(err.file)!.push(err);
  }

  let fixed = 0;
  let manual = 0;

  for (const [file, fileErrors] of byFile) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Ordenar de abajo hacia arriba
    const sortedErrors = [...fileErrors].sort((a, b) => {
        if (b.line !== a.line) return b.line - a.line;
        return b.col - a.col;
    });

    for (const err of sortedErrors) {
      const lineIdx = err.line - 1;
      let lineContent = lines[lineIdx];
      if (!lineContent) continue;

      // 1. Desestructuración: { name } -> { name: _name }
      const destructuringRegex = new RegExp(`(\\{.*)\\b${err.varName}\\b(.*\\})`);
      if (destructuringRegex.test(lineContent)) {
          // Asegurarse de no renombrar si ya tiene alias o si es parte de otra palabra
          // Caso { params } -> { params: _params }
          lines[lineIdx] = lineContent.replace(new RegExp(`\\b${err.varName}\\b(?![^}]*: )`), `${err.varName}: _${err.varName}`);
          modified = true;
          fixed++;
          console.log(`  📦 ${file}:${err.line} — Destructured alias: ${err.varName} -> _${err.varName}`);
          continue;
      }

      // 2. Parámetro simple o variable: (name: type) -> (_name: type)
      const paramRegex = new RegExp(`\\b${err.varName}\\b`);
      if (paramRegex.test(lineContent)) {
          lines[lineIdx] = lineContent.replace(paramRegex, `_${err.varName}`);
          modified = true;
          fixed++;
          console.log(`  📝 ${file}:${err.line} — Prefixed: ${err.varName} -> _${err.varName}`);
          continue;
      }

      manual++;
      console.log(`  ❓ ${file}:${err.line} — MANUAL: '${err.varName}' en "${lineContent.trim().substring(0, 50)}..."`);
    }

    if (modified) {
      fs.writeFileSync(fullPath, lines.join('\n'));
    }
  }

  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`📊 Saneamiento Pro completado:`);
  console.log(`   ✅ Saneados automáticamente: ${fixed}`);
  console.log(`   ❓ MANUAL: ${manual}`);
  console.log(`════════════════════════════════════════════════════\n`);

} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
