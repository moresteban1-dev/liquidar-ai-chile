#!/bin/bash
# scripts/generate-import-map.sh
# Genera un mapa exacto de "qué tipo está en qué archivo"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  📦 IMPORT MAP — Mapeo Tipo → Ubicación → Alias     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Cargar los aliases del tsconfig
echo "═══ PATH ALIASES CONFIGURADOS ═══"
node -e "
  const fs = require('fs');
  const path = require('path');
  const ts = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
  const paths = ts.compilerOptions?.paths || {};
  const baseUrl = ts.compilerOptions?.baseUrl || '.';

  // Para cada alias, mostrar qué resuelve
  for (const [alias, targets] of Object.entries(paths)) {
    const cleanAlias = alias.replace('/*', '');
    const cleanTarget = targets[0].replace('/*', '');
    const fullPath = path.resolve(baseUrl, cleanTarget);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      console.log('');
      console.log('📂', cleanAlias, '→', cleanTarget);

      // Listar archivos TypeScript en ese directorio
      const listFiles = (dir, depth = 0) => {
        if (depth > 3) return;
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.next') continue;
          const entryPath = path.join(dir, entry.name);
          const relative = entryPath.replace(fullPath + '/', '');
          if (entry.isDirectory()) {
            listFiles(entryPath, depth + 1);
          } else if (entry.name.endsWith('.ts') && !entry.name.includes('.test.')) {
            // Leer exports del archivo
            const content = fs.readFileSync(entryPath, 'utf-8');
            const exports = [];
            const exportRegex = /export\s+(?:interface|class|type|enum|const|function|abstract\s+class)\s+(\w+)/g;
            let match;
            while ((match = exportRegex.exec(content)) !== null) {
              exports.push(match[1]);
            }
            if (exports.length > 0) {
              const importPath = cleanAlias + '/' + relative.replace('.ts', '');
              console.log('   ', importPath);
              console.log('    exports:', exports.join(', '));
            }
          }
        }
      };
      listFiles(fullPath);
    }
  }
" 2>/dev/null

echo ""
echo ""
echo "═══ MAPA DE IMPORTS RECOMENDADOS ═══"
echo ""

# Para cada tipo clave, generar el import correcto
node -e "
  const fs = require('fs');
  const path = require('path');
  const ts = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
  const paths = ts.compilerOptions?.paths || {};
  const baseUrl = ts.compilerOptions?.baseUrl || '.';

  const typesToFind = [
    'QuotationRepository',
    'OrderRepository',
    'ProviderRepository',
    'CatalogRepository',
    'AIBrokerPort',
    'DomainEventBus',
    'NotificationPort',
    'Result',
    'AppError',
    'Quotation',
    'Order',
    'Money',
    'QuotationV2Mapper',
    'QuotationItem',
    'QuotationStatus',
    'OrderStatus',
    'StructuredLogger',
  ];

  // Buscar cada tipo en src/
  const findType = (typeName) => {
    const searchDir = (dir) => {
      if (!fs.existsSync(dir)) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const result = searchDir(fullPath);
          if (result) return result;
        } else if (entry.name.endsWith('.ts') && !entry.name.includes('.test.')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const regex = new RegExp('export\\\\s+(?:interface|class|type|enum|abstract\\\\s+class)\\\\s+' + typeName + '\\\\b');
          if (regex.test(content)) {
            return fullPath;
          }
        }
      }
      return null;
    };
    return searchDir('src');
  };

  // Convertir path absoluto a import con alias
  const toAliasImport = (filePath) => {
    const relative = path.relative(baseUrl, filePath).replace('.ts', '');

    for (const [alias, targets] of Object.entries(paths)) {
      const cleanAlias = alias.replace('/*', '');
      const cleanTarget = targets[0].replace('/*', '');

      if (relative.startsWith(cleanTarget)) {
        return relative.replace(cleanTarget, cleanAlias);
      }
    }
    return './' + relative;
  };

  console.log('// ═══════════════════════════════════════════');
  console.log('// IMPORT MAP — Copiar y usar en tus archivos');
  console.log('// ═══════════════════════════════════════════');
  console.log('');

  for (const typeName of typesToFind) {
    const location = findType(typeName);
    if (location) {
      const aliasPath = toAliasImport(location);
      const isInterface = fs.readFileSync(location, 'utf-8').includes('export interface ' + typeName);
      const importType = isInterface ? 'import type' : 'import';
      console.log(\`\${importType} { \${typeName} } from '\${aliasPath}';\`);
    } else {
      console.log(\`// ❌ \${typeName} — NOT FOUND in src/\`);
    }
  }
" 2>/dev/null
