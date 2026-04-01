const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

/**
 * Lista de prefijos a limpiar en los imports
 */
const PREFIXES_TO_CLEAN = [
  '_createApiClient',
  '_createServiceRoleClient',
  '_Suspense',
  '_Tags',
  '_Package',
  '_CardHeader',
  '_useState',
  '_ItemType',
  '_CatalogStatus',
  '_Button',
  '_toast',
  '_useMemo',
  '_Failure',
  '_logger',
  '_DEFAULT_IVA_RATE',
  '_MessageSchema',
  '_QuoteItemRequested',
  '_PlatformConfigRecord',
  '_NextResponse',
  '_SemanticResourceAttributes',
  '_Tags',
  '_Package'
];

/**
 * Función recursiva para procesar archivos
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      cleanFile(fullPath);
    }
  }
}

/**
 * Limpia un archivo específico
 */
function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Limpiar prefijos erróneos en imports {}
  PREFIXES_TO_CLEAN.forEach(prefix => {
    const cleanName = prefix.startsWith('_') ? prefix.substring(1) : prefix;
    
    // Regex para encontrar { ... _Name ... } o { _Name }
    const regex = new RegExp(`\\{\\s*([^}]*)\\b${prefix}\\b([^}]*)\\s*\\}`, 'g');
    content = content.replace(regex, (match, before, after) => {
      return `{ ${before}${cleanName}${after} }`.replace(/\s+/g, ' ');
    });

    // También buscar usos directos si el import fue limpiado
    const useRegex = new RegExp(`\\b${prefix}\\b`, 'g');
    content = content.replace(useRegex, cleanName);
  });

  // 2. Limpiar variables sin usar con prefijo __ (marcar como intencionalmente sin usar con _)
  // El compilador TS6133 ignora variables que empiezan por _
  // El script previo parece haber usado __ y TS no las ignora automáticamente según la config actual
  // Las reemplazaremos por _ para que el compilador las ignore
  content = content.replace(/\b__(?=[a-zA-Z])/g, '_');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saneado: ${path.relative(process.cwd(), filePath)}`);
  }
}

console.log('🚀 Iniciando Health Sweep: Strike Final V2...');
processDirectory(SRC_DIR);
console.log('🏁 Health Sweep Completado.');
