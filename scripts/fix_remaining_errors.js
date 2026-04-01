const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/core/application/handlers/SendQuotationToClientHandler.ts',
    rules: [
      { from: /Promise<Result<Quotation, string>>/g, to: 'Promise<Result<Quotation, import("@/core/shared/AppError").AppError>>' },
      { from: /Result\.fail\(quotationRes\.getError\(\)\)/g, to: 'Result.fail(quotationRes.getError())' }, // Keep as is if already AppError
      { from: /Result\.fail\('Cotización no encontrada'\)/g, to: 'Result.fail(import("@/core/shared/AppError").AppError.notFound("Cotización no encontrada"))' },
      { from: /Result\.fail\(sendRes\.getError\(\)\)/g, to: 'Result.fail(sendRes.getError())' },
      { from: /Result\.fail\(saveResult\.getError\(\)\)/g, to: 'Result.fail(saveResult.getError())' }
    ]
  },
  {
    file: 'src/core/application/handlers/UpdateClientItemsHandler.ts',
    rules: [
      { from: /Promise<Result<Quotation, string>>/g, to: 'Promise<Result<Quotation, import("@/core/shared/AppError").AppError>>' },
      { from: /Result\.fail\(quotationRes\.getError\(\)\)/g, to: 'Result.fail(quotationRes.getError())' },
      { from: /Result\.fail\('Quotation not found'\)/g, to: 'Result.fail(import("@/core/shared/AppError").AppError.notFound("Quotation not found"))' },
      { from: /Result\.fail\(updateRes\.getError\(\)\)/g, to: 'Result.fail(updateRes.getError())' },
      { from: /Result\.fail\(saveResult\.getError\(\)\)/g, to: 'Result.fail(saveResult.getError())' }
    ]
  },
  {
    file: 'src/core/application/handlers/UpdateProviderItemsHandler.ts',
    rules: [
      { from: /Promise<Result<Quotation, string>>/g, to: 'Promise<Result<Quotation, import("@/core/shared/AppError").AppError>>' },
      { from: /Result\.fail\(quotationRes\.getError\(\)\)/g, to: 'Result.fail(quotationRes.getError())' },
      { from: /Result\.fail\('Quotation not found'\)/g, to: 'Result.fail(import("@/core/shared/AppError").AppError.notFound("Quotation not found"))' },
      { from: /Result\.fail\(updateRes\.getError\(\)\)/g, to: 'Result.fail(updateRes.getError())' },
      { from: /Result\.fail\(saveResult\.getError\(\)\)/g, to: 'Result.fail(saveResult.getError())' }
    ]
  },
  {
    file: 'src/core/application/handlers/UpdateRequestedItemsHandler.ts',
    rules: [
      { from: /Promise<Result<Quotation, string>>/g, to: 'Promise<Result<Quotation, import("@/core/shared/AppError").AppError>>' },
      { from: /Result\.fail\(quotationRes\.getError\(\)\)/g, to: 'Result.fail(quotationRes.getError())' },
      { from: /Result\.fail\('Quotation not found'\)/g, to: 'Result.fail(import("@/core/shared/AppError").AppError.notFound("Quotation not found"))' },
      { from: /Result\.fail\(updateRes\.getError\(\)\)/g, to: 'Result.fail(updateRes.getError())' },
      { from: /Result\.fail\(saveResult\.getError\(\)\)/g, to: 'Result.fail(saveResult.getError())' }
    ]
  },
  {
    file: 'src/infrastructure/notifications/channels/EmailChannel.ts',
    rules: [
      { from: /import { INotificationChannel/g, to: 'import { INotificationChannel, NotificationRecipient' }
    ]
  },
  {
    file: 'src/core/application/handlers/AssignProviderToOrderHandler.ts',
    rules: [
      { from: /Promise<Result<Order, string>>/g, to: 'Promise<Result<Order, import("@/core/shared/AppError").AppError>>' },
      { from: /return new Failure\('Order not found'\)/g, to: 'return new Failure(import("@/core/shared/AppError").AppError.notFound("Order not found"))' },
      { from: /return new Success\(order\)/g, to: 'return new Success(order!)' }, // order check was at line 19/21 but TS might still complain
      { from: /orderResult\.getValue\(\)/g, to: 'orderResult.getValue()!' }
    ]
  },
  {
      file: 'src/core/application/handlers/GetOrderByIdHandler.ts',
      rules: [
          { from: /Promise<Result<Order, AppError>>/g, to: 'Promise<Result<Order, import("@/core/shared/AppError").AppError>>' },
          { from: /if \(!orderResult\.getValue\(\)\) return new Failure\(AppError\.notFound\('Order not found'\)\)/g, to: 'if (!orderResult.getValue()) return new Failure(import("@/core/shared/AppError").AppError.notFound("Order not found"))' },
          { from: /return new Success\(orderResult\.getValue\(\)\)/g, to: 'return new Success(orderResult.getValue()!)' }
      ]
  }
];

for (const rep of replacements) {
  const fullPath = path.join(process.cwd(), rep.file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  for (const rule of rep.rules) {
    content = content.replace(rule.from, rule.to);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${rep.file}`);
}
