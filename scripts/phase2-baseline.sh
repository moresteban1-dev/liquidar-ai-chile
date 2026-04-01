#!/bin/bash
# scripts/phase2-baseline.sh

echo "╔══════════════════════════════════════════════════╗"
echo "║  📊 BASELINE — Phase 2 Stabilization            ║"
echo "╚══════════════════════════════════════════════════╝"

echo "Fecha: $(date)" > phase2-baseline.txt

echo "" >> phase2-baseline.txt
echo "═══ ERRORES TSC TOTALES ═══" >> phase2-baseline.txt
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l >> phase2-baseline.txt

echo "" >> phase2-baseline.txt
echo "═══ POR TIPO ═══" >> phase2-baseline.txt
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error //' | cut -d':' -f1 | sort | uniq -c | sort -rn >> phase2-baseline.txt

echo "" >> phase2-baseline.txt
echo "═══ ARCHIVOS QUE IMPORTAN Quotation DE UI ═══" >> phase2-baseline.txt
grep -rn "from.*QuotationsTable" src/ --include="*.ts" --include="*.tsx" 2>/dev/null >> phase2-baseline.txt

echo "" >> phase2-baseline.txt
echo "═══ ARCHIVOS QUE IMPORTAN Order DE UI ═══" >> phase2-baseline.txt
grep -rn "from.*OrdersTable" src/ --include="*.ts" --include="*.tsx" 2>/dev/null >> phase2-baseline.txt

echo "" >> phase2-baseline.txt
echo "═══ THROWS EN INFRASTRUCTURE ═══" >> phase2-baseline.txt
grep -rn "throw new" src/infrastructure/ --include="*.ts" 2>/dev/null | grep -v ".test." | wc -l >> phase2-baseline.txt

cat phase2-baseline.txt
