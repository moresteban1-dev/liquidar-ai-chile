#!/bin/bash
# scripts/audit-all.sh

echo "🔍 Auditoría de Salud del Proyecto"
echo "================================"

echo -e "\n📁 Archivos legacy identificados:"
find src -type f \( -name "*legacy*" -o -name "*old*" -o -name "*.backup" \)

echo -e "\n📊 Usos de 'any' en el proyecto (excluyendo tests):"
grep -r ": any" src --include="*.ts" --include="*.tsx" | grep -v ".test.ts" | wc -l

echo -e "\n📂 Top 5 archivos con más 'any':"
grep -r ": any" src --include="*.ts" --include="*.tsx" | grep -v ".test.ts" | cut -d: -f1 | sort | uniq -c | sort -nr | head -n 5

echo -e "\n📊 Métodos de logging (console vs logger):"
echo "console.log:" $(grep -r "console.log" src | wc -l)
echo "console.error:" $(grep -r "console.error" src | wc -l)
echo "logger.info/error:" $(grep -r "logger\." src | wc -l)

echo -e "\n✅ Auditoría finalizada."
