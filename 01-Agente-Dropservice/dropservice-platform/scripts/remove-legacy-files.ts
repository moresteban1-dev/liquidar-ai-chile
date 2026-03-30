// scripts/remove-legacy-files.ts
import fs from 'fs/promises';
import path from 'path';

interface LegacyFile {
  path: string;
  reason: string;
}

const LEGACY_FILES: LegacyFile[] = [
  {
    path: 'src/core/application/services/availability-service.ts',
    reason: 'Replaced by new availability module in Catalog V2 refactor',
  },
  {
    path: 'src/core/application/services/image-storage.ts',
    reason: 'Replaced by unified media storage service/upload API',
  },
  {
    path: 'src/core/domain/catalog/catalog-types.ts',
    reason: 'Deprecated/Duplicate of CatalogTypes.ts',
  },
  {
    path: 'src/core/application/services/catalog-service.ts',
    reason: 'Duplicate of unified CatalogService.ts (PascalCase)',
  }
];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function removeLegacyFiles() {
  console.log('🗑️  Iniciando eliminación de archivos legacy...\n');

  const results = {
    removed: [] as string[],
    notFound: [] as string[],
    errors: [] as { file: string; error: string }[],
  };

  for (const { path: filePath, reason } of LEGACY_FILES) {
    try {
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      if (await fileExists(absolutePath)) {
        await fs.unlink(absolutePath);
        results.removed.push(filePath);
        console.log(`✅ Eliminado: ${filePath}`);
        console.log(`   Razón: ${reason}\n`);
      } else {
        results.notFound.push(filePath);
        console.log(`⚠️  No encontrado: ${filePath}\n`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push({ file: filePath, error: errorMsg });
      console.log(`❌ Error eliminando ${filePath}: ${errorMsg}\n`);
    }
  }

  // Generar reporte
  console.log('\n📊 Resumen de eliminación:');
  console.log(`   ✅ Eliminados: ${results.removed.length}`);
  console.log(`   ⚠️  No encontrados: ${results.notFound.length}`);
  console.log(`   ❌ Errores: ${results.errors.length}`);

  // Guardar reporte
  await fs.writeFile(
    path.resolve(process.cwd(), 'legacy-removal-report.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n📄 Reporte guardado en: legacy-removal-report.json');
}

removeLegacyFiles().catch(console.error);
