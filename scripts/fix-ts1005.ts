import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/actions/quotations/admin-mutations.ts',
  'src/app/admin/OptimizationPanel.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/client/loading.tsx',
  'src/app/client/orders/[id]/QuotationActions.tsx',
  'src/components/admin/catalog/CatalogCategoryForm.tsx',
  'src/components/vendor/CatalogItemPicker.tsx',
  'src/core/application/handlers/NotifyClientOnOrderUpdateHandler.ts',
  'src/core/application/ports/PlatformConfigRepository.ts',
  'src/core/application/services/VariantGeneratorService.ts',
  'src/core/domain/pricing/PricingCalculator.ts',
  'src/infrastructure/persistence/supabase/mappers/OrderMapper.ts',
  'src/infrastructure/persistence/supabase/repositories/InstrumentedRepository.ts'
];

files.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf-8');
  // Buscar import { ... Var: _Var ... } y cambiarlo a as
  const newContent = content.replace(/(import\s+\{.*)\b(\w+):\s+(_\w+)\b(.*\}\s+from)/g, '$1$2 as $3$4');
  
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`✅ Fixed imports in: ${file}`);
  } else {
    console.log(`⚠️ No changes needed for: ${file}`);
  }
});
