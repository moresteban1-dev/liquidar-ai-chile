const fs = require('fs');
const files = [
  'src/core/application/handlers/UpdateQuotationHandler.test.ts',
  'src/core/application/handlers/DeleteOrderHandler.test.ts',
  'src/core/application/handlers/CreateOrderHandler.test.ts',
  'src/core/application/handlers/AttachQuotationToOrderHandler.test.ts',
  'src/core/application/handlers/AssignProviderToOrderHandler.test.ts'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const replaced = content.replace(/expect\(result\.getError\(\)\)\.toContain/g, "expect((result.getError() as any).message || result.getError()).toContain");
  fs.writeFileSync(file, replaced);
}
