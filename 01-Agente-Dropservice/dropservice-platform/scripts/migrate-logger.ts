import * as fs from 'fs';
import * as path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'src');
const IMPORT_STATEMENT = "import { logger } from '@/infrastructure/observability/structured-logger';\n";

function processFile(filePath: string) {
    if (filePath.includes('logger.ts') || filePath.includes('structured-logger.ts')) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    const hasConsoleError = /console\.error\(/g.test(content);
    const hasConsoleWarn = /console\.warn\(/g.test(content);

    if (!hasConsoleError && !hasConsoleWarn) return;

    // Replace
    content = content.replace(/console\.error\(/g, 'logger.error(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');

    // Add import if not exists
    if (!content.includes('import { logger }')) {
        const firstImportMatch = content.match(/^import\s+/m);
        if (firstImportMatch && firstImportMatch.index !== undefined) {
            // Insert before the first import
            content = content.slice(0, firstImportMatch.index) + IMPORT_STATEMENT + content.slice(firstImportMatch.index);
        } else {
            const directiveMatch = content.match(/^(?:'|")use (?:client|server)(?:'|");?/m);
            if (directiveMatch && directiveMatch.index !== undefined) {
                // Insert after the directive
                const insertPos = directiveMatch.index + directiveMatch[0].length;
                content = content.slice(0, insertPos) + '\n\n' + IMPORT_STATEMENT + content.slice(insertPos);
            } else {
                // Prepend at the absolute top
                content = IMPORT_STATEMENT + '\n' + content;
            }
        }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
}

function traverse(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

console.log('Starting migration...');
traverse(TARGET_DIR);
console.log('Migration complete.');
