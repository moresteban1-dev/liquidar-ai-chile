// scripts/migrate-logs.ts
import fs from 'fs/promises';
import path from 'path';

interface LogMigration {
  filePath: string;
  migratedLines: number;
}

async function migrateLogsInFile(filePath: string): Promise<LogMigration> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let migratedLines = 0;

  // Use simple regex replacement for core files
  // We prioritize structured logging over pure console
  let newContent = content
    .replace(/console\.log\((.*?)\)/g, (match, args) => {
      migratedLines++;
      return `logger.info(${args})`;
    })
    .replace(/console\.error\((.*?)\)/g, (match, args) => {
      migratedLines++;
      return `logger.error(${args})`;
    })
    .replace(/console\.warn\((.*?)\)/g, (match, args) => {
      migratedLines++;
      return `logger.warn(${args})`;
    });

  if (migratedLines > 0) {
    // Add logger import if missing and not already present
    if (!newContent.includes("import { logger }")) {
      // Find suitable place for import (after last import)
      const importLines = lines.filter(l => l.startsWith('import '));
      const lastImport = importLines[importLines.length - 1];
      if (lastImport) {
        newContent = newContent.replace(lastImport, `${lastImport}\nimport { logger } from '@/infrastructure/observability/structured-logger';`);
      } else {
        newContent = `import { logger } from '@/infrastructure/observability/structured-logger';\n${newContent}`;
      }
    }
    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  return { filePath, migratedLines };
}

async function migrateAllLogs() {
  console.log('📝 Iniciando migración de logs...\n');

  const rootDir = path.resolve(process.cwd(), 'src');
  const results: LogMigration[] = [];

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        await scan(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
        const result = await migrateLogsInFile(fullPath);
        if (result.migratedLines > 0) {
          results.push(result);
          console.log(`✅ ${path.relative(process.cwd(), fullPath)}: ${result.migratedLines} logs migrados`);
        }
      }
    }
  }

  await scan(rootDir);

  console.log(`\n📊 Total: ${results.length} archivos modificados`);
  console.log(`   Total logs migrados: ${results.reduce((sum, r) => sum + r.migratedLines, 0)}`);
}

migrateAllLogs().catch(console.error);
