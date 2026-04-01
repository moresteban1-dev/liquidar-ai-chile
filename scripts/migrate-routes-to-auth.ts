// scripts/migrate-routes-to-auth.ts
// Ejecutar: npx tsx scripts/migrate-routes-to-auth.ts

import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = !process.argv.includes('--apply');

function getFilesRecursive(dir: string): string[] {
  const absoluteDir = path.resolve(dir);
  if (!fs.existsSync(absoluteDir)) {
    console.log(`⚠️  Directorio no encontrado: ${absoluteDir}`);
    return [];
  }
  
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];
  
  for (const e of entries) {
    const res = path.join(absoluteDir, e.name);
    if (e.isDirectory() && !['node_modules', '.next'].includes(e.name)) {
      files.push(...getFilesRecursive(res));
    } else if (e.name === 'route.ts' || e.name === 'route.tsx') {
      files.push(res);
    }
  }
  return files;
}

function isAdminRoute(filePath: string): boolean {
  return filePath.includes('admin');
}

function hasAuth(content: string): boolean {
  return /withAuth|withAdmin|withSecurity|requireAdmin|requireAuth|getServerSession|getUser|auth\(/.test(content);
}

function extractMethods(content: string): string[] {
  return Array.from(
    content.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g),
  ).map(m => m[1]);
}

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  🔐 MIGRACIÓN DE RUTAS → withAuth/withAdmin      ║');
console.log(`║  Modo: ${DRY_RUN ? 'DRY RUN (preview)' : '⚠️  APLICANDO'}${''.padEnd(DRY_RUN ? 17 : 22)}║`);
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

const apiRoutes = getFilesRecursive('c:/Users/Esteban/Desktop/Skill IA/01-Agente-Dropservice/dropservice-platform/src/app/api');
let migrated = 0;
let skipped = 0;
let alreadyProtected = 0;

for (const file of apiRoutes) {
  const content = fs.readFileSync(file, 'utf-8');
  const methods = extractMethods(content);

  if (methods.length === 0) {
    skipped++;
    continue;
  }

  if (hasAuth(content)) {
    alreadyProtected++;
    console.log(`  ✅ ${file} [${methods.join(',')}] — ya protegida`);
    continue;
  }

  const isAdmin = isAdminRoute(file);
  const wrapper = isAdmin ? 'withAdmin' : 'withAuth';

  console.log(`  🔧 ${file} [${methods.join(',')}] → ${wrapper}`);

  if (!DRY_RUN) {
    let newContent = content;

    // Agregar import si no existe
    if (!newContent.includes("from '@/lib/api/with-auth'")) {
      const importStatement = isAdmin
        ? "import { withAdmin } from '@/lib/api/with-auth';\n"
        : "import { withAuth } from '@/lib/api/with-auth';\n";

      // Insertar después del último import
      const lastImportIdx = newContent.lastIndexOf('import ');
      if (lastImportIdx !== -1) {
        const endOfImport = newContent.indexOf('\n', lastImportIdx) + 1;
        newContent =
          newContent.slice(0, endOfImport) +
          importStatement +
          newContent.slice(endOfImport);
      } else {
        newContent = importStatement + newContent;
      }
    }

    // Transformar cada método HTTP
    for (const method of methods) {
      // Patrón: export async function GET(request: NextRequest, ...) {
      const funcRegex = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)`,
      );

      if (funcRegex.test(newContent)) {
        // Reemplazar con wrapper
        const replacement = `export const ${method} = ${wrapper}(async (request, user`;
        newContent = newContent.replace(
          funcRegex,
          replacement,
        );

        console.log(`     ⚠️  ${method}: Revisar cierre de función manualmente`);
      }
    }

    fs.writeFileSync(file, newContent);
  }

  migrated++;
}

console.log('');
console.log('═══════════════════════════════════════════');
console.log(`📊 Resumen:`);
console.log(`   Total rutas:      ${apiRoutes.length}`);
console.log(`   Ya protegidas:    ${alreadyProtected}`);
console.log(`   Migradas:         ${migrated}`);
console.log(`   Sin métodos HTTP: ${skipped}`);
console.log('');

if (DRY_RUN) {
  console.log('💡 Para aplicar: npx tsx scripts/migrate-routes-to-auth.ts --apply');
  console.log('⚠️  Después de aplicar, revisar cada archivo manualmente');
} else {
  console.log('✅ Cambios aplicados. REVISAR CADA ARCHIVO:');
  console.log('   - Cierre correcto de funciones');
  console.log('   - Parámetro user utilizado donde corresponda');
  console.log('   - Imports sin duplicar');
}
