#!/bin/bash
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🔬 DATOS CRUDOS PARA INFORME EXHAUSTIVO             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════
# BLOQUE 1: TYPESCRIPT — Los 194 errores exactos
# ═══════════════════════════════════════════
echo "═══ 1/6 TSC — POR TIPO DE ERROR ═══"
npx tsc --noEmit 2>&1 | grep "error TS" | sed 's/.*error //' | cut -d':' -f1 | sort | uniq -c | sort -rn

echo ""
echo "═══ 2/6 TSC — TOP 25 ARCHIVOS ═══"
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -25

echo ""
echo "═══ 3/6 TSC — PRIMEROS 60 ERRORES COMPLETOS ═══"
npx tsc --noEmit 2>&1 | grep "error TS" | head -60

# ═══════════════════════════════════════════
# BLOQUE 2: SEGURIDAD — Las 43 rutas
# ═══════════════════════════════════════════
echo ""
echo "═══ 4/6 SEGURIDAD — RUTAS API SIN AUTH ═══"
find src/app/api -name "route.ts" -o -name "route.tsx" 2>/dev/null | while read file; do
  has_auth=$(grep -c "getServerSession\|auth(\|getSession\|requireAdmin\|requireAuth\|getUser\|cookies()" "$file" 2>/dev/null)
  methods=$(grep -o "export.*function \(GET\|POST\|PUT\|DELETE\|PATCH\)" "$file" 2>/dev/null | grep -o "GET\|POST\|PUT\|DELETE\|PATCH" | tr '\n' ',' | sed 's/,$//')
  if [ "$has_auth" -eq 0 ] && [ -n "$methods" ]; then
    echo "  ❌ $file [$methods]"
  fi
done

echo ""
echo "═══ 5/6 INFRAESTRUCTURA — PROMESAS NO AWAITED ═══"
grep -rn "supabase\.\|\.from(" src/infrastructure/ --include="*.ts" 2>/dev/null \
  | grep -v ".test." | grep -v "await" | grep -v "//" | head -20

echo ""
echo "═══ 6/6 PERFORMANCE — USE CLIENT INNECESARIOS ═══"
find src -name "*.tsx" | while read file; do
  if grep -q "'use client'\|\"use client\"" "$file"; then
    hooks=$(grep -c "useState\|useEffect\|useRef\|useCallback\|onClick\|onChange\|onSubmit" "$file")
    if [ "$hooks" -eq 0 ]; then
      echo "  ⚠️  $file (use client sin hooks)"
    fi
  fi
done

echo ""
echo "═══ TOTAL TSC ═══"
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
