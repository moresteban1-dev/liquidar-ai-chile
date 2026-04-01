#!/bin/bash
# scripts/map-structure.sh
# Ejecutar: chmod +x scripts/map-structure.sh && ./scripts/map-structure.sh

echo "╔══════════════════════════════════════════════════════╗"
echo "║  🗺️  MAPA FORENSE DE ESTRUCTURA                     ║"
echo "║  Descubrimiento exacto de paths y dependencias       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════
# 1. ÁRBOL COMPLETO DE src/ (solo directorios)
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "1/10  ÁRBOL DE DIRECTORIOS (src/)"
echo "═══════════════════════════════════════════"
find src -type d | sort | head -80
echo ""

# ═══════════════════════════════════════════
# 2. DÓNDE ESTÁN LOS PORTS/INTERFACES
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "2/10  PORTS & INTERFACES"
echo "═══════════════════════════════════════════"

echo "--- Directorios que contienen 'port' ---"
find src -type d -iname "*port*" 2>/dev/null
echo ""

echo "--- Archivos que contienen 'port' en el nombre ---"
find src -type f -iname "*port*" -name "*.ts" 2>/dev/null
echo ""

echo "--- Archivos que contienen 'Repository' en el nombre ---"
find src -type f -iname "*repository*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

echo "--- Archivos que contienen 'interface' o 'Port' exportado ---"
grep -rln "export interface.*Repository\|export interface.*Port\|export type.*Repository\|export type.*Port" src/ --include="*.ts" 2>/dev/null | sort
echo ""

# ═══════════════════════════════════════════
# 3. DÓNDE ESTÁN LOS AGGREGATES Y ENTITIES
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "3/10  DOMAIN — Aggregates & Entities"
echo "═══════════════════════════════════════════"

echo "--- Directorios domain ---"
find src -type d -iname "*domain*" 2>/dev/null
echo ""

echo "--- Aggregates ---"
find src -type f -iname "*aggregate*" -o -iname "Quotation.ts" -o -iname "Order.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

echo "--- Entities ---"
find src -type f -path "*/entities/*" -name "*.ts" 2>/dev/null | grep -v ".test."
echo ""

echo "--- Value Objects ---"
find src -type f -path "*/value-objects/*" -o -path "*/valueObjects/*" 2>/dev/null | grep -v ".test." | grep ".ts$"
echo ""

# ═══════════════════════════════════════════
# 4. DÓNDE ESTÁN LOS HANDLERS / USE CASES
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "4/10  APPLICATION — Handlers & Use Cases"
echo "═══════════════════════════════════════════"

echo "--- Directorios application ---"
find src -type d -iname "*application*" -o -type d -iname "*handlers*" -o -type d -iname "*use-case*" -o -type d -iname "*usecases*" 2>/dev/null
echo ""

echo "--- Archivos Handler ---"
find src -type f -iname "*handler*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

echo "--- Archivos UseCase ---"
find src -type f -iname "*usecase*" -o -iname "*use-case*" 2>/dev/null | grep ".ts$" | grep -v ".test."
echo ""

# ═══════════════════════════════════════════
# 5. DÓNDE ESTÁN LOS MAPPERS
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "5/10  INFRASTRUCTURE — Mappers & Adapters"
echo "═══════════════════════════════════════════"

echo "--- Mappers ---"
find src -type f -iname "*mapper*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

echo "--- Adapters ---"
find src -type f -iname "*adapter*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

echo "--- Supabase implementations ---"
find src -type f -iname "supabase*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test."
echo ""

# ═══════════════════════════════════════════
# 6. DÓNDE ESTÁN LOS SHARED / CORE
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "6/10  SHARED — Result, Errors, Utils"
echo "═══════════════════════════════════════════"

echo "--- Result.ts ---"
find src -type f -name "Result.ts" 2>/dev/null
echo ""

echo "--- Error types ---"
find src -type f -iname "*error*" -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test." | head -15
echo ""

echo "--- Shared utilities ---"
find src -path "*/shared/*" -name "*.ts" -type f 2>/dev/null | grep -v ".test." | head -20
echo ""

# ═══════════════════════════════════════════
# 7. TSCONFIG — Path Aliases Definidos
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "7/10  TSCONFIG — Path Aliases"
echo "═══════════════════════════════════════════"

echo "--- tsconfig.json paths ---"
if [ -f tsconfig.json ]; then
  # Extraer la sección paths del tsconfig
  node -e "
    const fs = require('fs');
    const path = require('path');
    try {
      const ts = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
      const paths = ts.compilerOptions?.paths || {};
      const baseUrl = ts.compilerOptions?.baseUrl || '.';
      console.log('baseUrl:', baseUrl);
      console.log('');
      for (const [alias, targets] of Object.entries(paths)) {
        const target = targets[0];
        const resolved = path.resolve(baseUrl, target.replace('/*', ''));
        const exists = fs.existsSync(resolved);
        console.log(exists ? '✅' : '❌', alias.padEnd(20), '→', target.padEnd(25), exists ? '' : '(NO EXISTE)');
      }
    } catch(e) { console.log('⚠️ Error parsing tsconfig'); }
  " 2>/dev/null || echo "⚠️  No se pudo parsear tsconfig.json con Node"
else
  echo "❌ tsconfig.json no encontrado"
fi
echo ""

# ═══════════════════════════════════════════
# 8. QUÉ IMPORTAN LOS HANDLERS ACTUALMENTE
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "8/10  IMPORTS ACTUALES EN HANDLERS"
echo "═══════════════════════════════════════════"

echo "--- Imports en archivos que contienen 'Handler' ---"
find src -type f -iname "*handler*" -name "*.ts" ! -name "*.test.*" 2>/dev/null | while read file; do
  echo ""
  echo "📄 $file"
  grep "^import\|^} from" "$file" 2>/dev/null | head -15
done
echo ""

# ═══════════════════════════════════════════
# 9. IMPORTS QUE FALLAN (TS2307)
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "9/10  IMPORTS ROTOS (TS2307)"
echo "═══════════════════════════════════════════"

echo "--- Módulos que no se encuentran ---"
npx tsc --noEmit 2>&1 | grep "TS2307" | grep -oP "Cannot find module '\K[^']*" | sort | uniq -c | sort -rn | head -20
echo ""

echo "--- Archivos con imports rotos ---"
npx tsc --noEmit 2>&1 | grep "TS2307" | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -15
echo ""

# ═══════════════════════════════════════════
# 10. DEFINICIONES REALES DE TIPOS CLAVE
# ═══════════════════════════════════════════
echo "═══════════════════════════════════════════"
echo "10/10 UBICACIÓN REAL DE TIPOS CLAVE"
echo "═══════════════════════════════════════════"

TYPES_TO_FIND=(
  "QuotationRepository"
  "OrderRepository"
  "ProviderRepository"
  "CatalogRepository"
  "AIBrokerPort"
  "DomainEventBus"
  "NotificationPort"
  "Result"
  "AppError"
  "Quotation"
  "Order"
  "Money"
  "QuotationV2Mapper"
)

for type_name in "${TYPES_TO_FIND[@]}"; do
  location=$(grep -rn "export.*\(interface\|class\|type\|abstract\) ${type_name}\b" src/ --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v ".test." | head -1)
  if [ -n "$location" ]; then
    file=$(echo "$location" | cut -d: -f1)
    line=$(echo "$location" | cut -d: -f2)
    echo "  ✅ ${type_name}"
    echo "     📄 ${file}:${line}"
  else
    echo "  ❌ ${type_name} — NO ENCONTRADO en src/"
  fi
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🗺️  MAPA COMPLETO — Copiar TODO el output arriba   ║"
echo "╚══════════════════════════════════════════════════════╝"
