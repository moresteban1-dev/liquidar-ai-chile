import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ═══════════════════════════════════════════
// PASO 1: Leer tsconfig paths
// ═══════════════════════════════════════════
interface PathAlias {
  alias: string;      // @core/*
  target: string;     // ./src/core/*
  resolved: string;   // /absolute/path/to/src/core
  exists: boolean;
}

function loadPathAliases(): PathAlias[] {
  const tsconfigPath = path.resolve('tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    console.error('❌ tsconfig.json not found');
    return [];
  }

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  const paths = tsconfig.compilerOptions?.paths ?? {};
  const baseUrl = tsconfig.compilerOptions?.baseUrl ?? '.';

  const aliases: PathAlias[] = [];

  for (const [alias, targets] of Object.entries(paths)) {
    const targetArray = targets as string[];
    const cleanAlias = alias.replace('/*', '');
    const firstTarget = targetArray[0] ?? '';
    const cleanTarget = firstTarget.replace('/*', '');
    const resolved = path.resolve(baseUrl, cleanTarget);

    aliases.push({
      alias: cleanAlias,
      target: cleanTarget,
      resolved,
      exists: fs.existsSync(resolved),
    });
  }

  return aliases;
}

// ═══════════════════════════════════════════
// PASO 2: Descubrir todos los exports en src/
// ═══════════════════════════════════════════
interface ExportInfo {
  name: string;
  kind: 'interface' | 'class' | 'type' | 'enum' | 'const' | 'function' | 'abstract';
  file: string;
  line: number;
}

function discoverExports(dir: string): ExportInfo[] {
  const exports: ExportInfo[] = [];

  function scan(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        !entry.name.includes('.test.') &&
        !entry.name.includes('.spec.') &&
        !entry.name.endsWith('.d.ts')
      ) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          // Match: export interface/class/type/enum/const/function Name
          const match = line.match(
            /export\s+(interface|class|type|enum|const|function|abstract\s+class)\s+(\w+)/
          );
          if (match && match[1] && match[2]) {
            const kindStr = match[1];
            const nameStr = match[2];
            const kind = kindStr.includes('abstract') ? 'abstract' : kindStr as ExportInfo['kind'];
            exports.push({
              name: nameStr,
              kind,
              file: fullPath,
              line: i + 1,
            });
          }
        }
      }
    }
  }

  scan(dir);
  return exports;
}

// ═══════════════════════════════════════════
// PASO 3: Convertir path real a import con alias
// ═══════════════════════════════════════════
function fileToImportPath(filePath: string, aliases: PathAlias[]): string {
  const relative = path.relative('.', filePath).replace(/\\/g, '/').replace(/\.tsx?$/, '');

  // Intentar cada alias para encontrar el más específico
  let bestMatch = { alias: '', target: '', length: 0 };

  for (const a of aliases) {
    const cleanTargetForRelative = a.target.replace(/^\.\//, '').replace(/\\/g, '/');
    if (relative.startsWith(cleanTargetForRelative) && cleanTargetForRelative.length > bestMatch.length) {
      bestMatch = { alias: a.alias, target: cleanTargetForRelative, length: cleanTargetForRelative.length };
    }
  }

  if (bestMatch.length > 0) {
    return relative.replace(bestMatch.target, bestMatch.alias);
  }

  return './' + relative;
}

// ═══════════════════════════════════════════
// PASO 4: Obtener errores TS2307 y TS2304
// ═══════════════════════════════════════════
interface ImportError {
  file: string;
  line: number;
  code: string;
  missingModule?: string;
  missingName?: string;
}

function getImportErrors(): ImportError[] {
  let output = '';
  try {
    output = execSync('npx tsc --noEmit 2>&1', {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'stdout' in e) {
      output = (e as { stdout: string }).stdout ?? '';
    }
  }

  const errors: ImportError[] = [];
  for (const line of output.split('\n')) {
    if (line.includes('TS2307')) {
      const fileMatch = line.match(/^(.+?)\((\d+),/);
      const moduleMatch = line.match(/Cannot find module '([^']+)'/);
      if (fileMatch && fileMatch[1] && fileMatch[2] && moduleMatch && moduleMatch[1]) {
        errors.push({
          file: fileMatch[1],
          line: parseInt(fileMatch[2]),
          code: 'TS2307',
          missingModule: moduleMatch[1],
        });
      }
    }
    if (line.includes('TS2304')) {
      const fileMatch = line.match(/^(.+?)\((\d+),/);
      const nameMatch = line.match(/Cannot find name '([^']+)'/);
      if (fileMatch && fileMatch[1] && fileMatch[2] && nameMatch && nameMatch[1]) {
        errors.push({
          file: fileMatch[1],
          line: parseInt(fileMatch[2]),
          code: 'TS2304',
          missingName: nameMatch[1],
        });
      }
    }
  }

  return errors;
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  🗺️  GENERADOR DE IMPORT MAP EXACTO              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // 1. Cargar aliases
  console.log('📂 Cargando path aliases de tsconfig.json...');
  const aliases = loadPathAliases();
  console.log(`   Encontrados: ${aliases.length} aliases\n`);

  for (const a of aliases) {
    console.log(`   ${a.exists ? '✅' : '❌'} ${a.alias.padEnd(15)} → ${a.target}`);
  }
  console.log('');

  // 2. Descubrir exports
  console.log('🔍 Escaneando exports en src/...');
  const allExports = discoverExports('src');
  console.log(`   Encontrados: ${allExports.length} exports\n`);

  // Crear índice de exports por nombre
  const exportIndex = new Map<string, ExportInfo[]>();
  for (const exp of allExports) {
    if (!exportIndex.has(exp.name)) {
      exportIndex.set(exp.name, []);
    }
    const currentList = exportIndex.get(exp.name);
    if (currentList) {
      currentList.push(exp);
    }
  }

  // 3. Obtener errores
  console.log('🔍 Escaneando errores de TypeScript...');
  const errors = getImportErrors();
  const ts2307 = errors.filter(e => e.code === 'TS2307');
  const ts2304 = errors.filter(e => e.code === 'TS2304');
  console.log(`   TS2307 (module not found): ${ts2307.length}`);
  console.log(`   TS2304 (name not found):   ${ts2304.length}`);
  console.log('');

  // 4. Resolver TS2307 — módulos que no se encuentran
  if (ts2307.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log('📦 TS2307 — MÓDULOS NO ENCONTRADOS');
    console.log('═══════════════════════════════════════════');
    console.log('');

    const uniqueModules = new Map<string, string[]>();
    for (const err of ts2307) {
      if (!err.missingModule) continue;
      if (!uniqueModules.has(err.missingModule)) {
        uniqueModules.set(err.missingModule, []);
      }
      const fileList = uniqueModules.get(err.missingModule);
      if (fileList) {
        fileList.push(err.file);
      }
    }

    for (const [module, files] of uniqueModules) {
      console.log(`  ❌ "${module}" (usado en ${files.length} archivo(s))`);

      // Intentar encontrar qué debería ser
      // Extraer el nombre del tipo del path
      const typeName = path.basename(module);
      const possibleExports = exportIndex.get(typeName);

      if (possibleExports && possibleExports.length > 0) {
        for (const exp of possibleExports) {
          const correctImport = fileToImportPath(exp.file, aliases);
          console.log(`     ✅ ENCONTRADO: import { ${exp.name} } from '${correctImport}';`);
          console.log(`        📄 Definido en: ${exp.file}:${exp.line}`);
        }
      } else {
        // Buscar por nombre parcial
        const partial = typeName.toLowerCase();
        const similar = [...exportIndex.entries()]
          .filter(([name]) => name.toLowerCase().includes(partial))
          .slice(0, 3);

        if (similar.length > 0) {
          console.log(`     💡 Tipos similares encontrados:`);
          for (const [name, exps] of similar) {
            if (!exps || !exps[0]) continue;
            const imp = fileToImportPath(exps[0].file, aliases);
            console.log(`        → import { ${name} } from '${imp}';`);
          }
        } else {
          console.log(`     ❓ No se encontró ningún export llamado "${typeName}" en src/`);
        }
      }
      console.log('');
    }
  }

  // 5. Resolver TS2304 — nombres que no se encuentran
  if (ts2304.length > 0) {
    console.log('═══════════════════════════════════════════');
    console.log('📦 TS2304 — NOMBRES NO ENCONTRADOS');
    console.log('═══════════════════════════════════════════');
    console.log('');

    const uniqueNames = new Map<string, string[]>();
    for (const err of ts2304) {
      if (!err.missingName) continue;
      if (!uniqueNames.has(err.missingName)) {
        uniqueNames.set(err.missingName, []);
      }
      const nameFiles = uniqueNames.get(err.missingName);
      if (nameFiles) {
        nameFiles.push(err.file);
      }
    }

    for (const [name, files] of [...uniqueNames.entries()].sort((a, b) => b[1].length - a[1].length)) {
      const possibleExports = exportIndex.get(name);
      if (possibleExports && possibleExports.length > 0 && possibleExports[0]) {
        const exp = possibleExports[0];
        const importPath = fileToImportPath(exp.file, aliases);
        const isType = exp.kind === 'interface' || exp.kind === 'type';
        const importKeyword = isType ? 'import type' : 'import';

        console.log(`  ✅ "${name}" (${files.length}x) → ${importKeyword} { ${name} } from '${importPath}';`);
      } else {
        console.log(`  ❌ "${name}" (${files.length}x) → NO definido en src/`);
      }
    }
  }

  // 6. Generar archivo de referencia
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('📋 IMPORT REFERENCE (copiar a tu proyecto)');
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Tipos más importantes
  const keyTypes = [
    'Result', 'AppError',
    'IQuotationRepository', 'IOrderRepository', 'IProviderRepository',
    'ICatalogRepository', 'AIBrokerPort', 'DomainEventBus', 'NotificationPort',
    'Quotation', 'Order', 'Money',
    'QuotationV2Mapper', 'StructuredLogger',
  ];

  const results: string[] = [];
  for (const typeName of keyTypes) {
    const exps = exportIndex.get(typeName);
    if (exps && exps.length > 0 && exps[0]) {
      const exp = exps[0];
      const importPath = fileToImportPath(exp.file, aliases);
      const isType = exp.kind === 'interface' || exp.kind === 'type';
      const lineStr = `${isType ? 'import type' : 'import'} { ${typeName} } from '${importPath}';`;
      console.log(lineStr);
      results.push(lineStr);
    } else {
      console.log(`// ❌ ${typeName} — not found`);
      results.push(`// ❌ ${typeName} — not found`);
    }
  }

  fs.writeFileSync('IMPORT_MAP.md', `# Import Map Canónico\n\nGenerado: ${new Date().toISOString()}\n\n\`\`\`typescript\n${results.join('\n')}\n\`\`\`\n`);
  console.log('\n📄 Guardado en: IMPORT_MAP.md');
}

main();
