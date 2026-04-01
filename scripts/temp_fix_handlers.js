const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src/core/application/handlers');

const replacements = [
  {
    file: 'ListQuotationsByOrderHandler.ts',
    rules: [
      { from: /quotationsResult\.value/g, to: 'quotationsResult.getValue()' }
    ]
  },
  {
    file: 'order/CreateOrderUseCase.ts',
    rules: [
      { from: /priceResult\.error/g, to: 'priceResult.getError()' },
      { from: /pricingResult\.error/g, to: 'pricingResult.getError()' },
      { from: /orderResult\.error/g, to: 'orderResult.getError()' },
      { from: /savedResult\.error/g, to: 'savedResult.getError().message' },
      { from: /publishResult\.error/g, to: 'publishResult.getError()' }
    ]
  },
  {
    file: 'ListOrdersByProviderHandler.ts',
    rules: [
      { from: /Result<PaginatedResult<OrderSummaryDTO>, string>/g, to: 'Result<PaginatedResult<OrderSummaryDTO>, import("@/core/shared/AppError").AppError>' },
      { from: /paginationResult\.error/g, to: 'import("@/core/shared/AppError").AppError.internal(paginationResult.getError())' },
      { from: /paginationResult\.value/g, to: 'paginationResult.getValue()' },
      { from: /queryResult\.value/g, to: 'queryResult.getValue()' }
    ]
  },
  {
    file: 'ListOrdersByClientHandler.ts',
    rules: [
      { from: /Result<PaginatedResult<OrderSummaryDTO>, string>/g, to: 'Result<PaginatedResult<OrderSummaryDTO>, import("@/core/shared/AppError").AppError>' },
      { from: /paginationResult\.error/g, to: 'import("@/core/shared/AppError").AppError.internal(paginationResult.getError())' },
      { from: /paginationResult\.value/g, to: 'paginationResult.getValue()' },
      { from: /queryResult\.value/g, to: 'queryResult.getValue()' }
    ]
  },
  {
    file: 'AssignProviderToOrderHandler.ts',
    rules: [
      { from: /orderResult\.value/g, to: 'orderResult.getValue()' }
    ]
  },
  {
    file: 'AdminDashboardHandler.ts',
    rules: [
      { from: /statsResult\.value/g, to: 'statsResult.getValue()' },
      { from: /recentResult\.value/g, to: 'recentResult.getValue()' },
      { from: /upcomingResult\.value/g, to: 'upcomingResult.getValue()' },
      { from: /stats\.ordersByStatus/g, to: 'stats.byStatus' } // Fix a likely compilation issue if byStatus was renamed
    ]
  },
  {
    file: 'TransitionOrderStateHandler.test.ts',
    rules: [{ from: /result\.error/g, to: 'result.getError()' }]
  },
  {
    file: 'QuotationWorkflow.test.ts',
    rules: [
      { from: /orderResult\.error\.message/g, to: 'orderResult.getError().message' },
      { from: /createResult\.error\.message/g, to: 'createResult.getError().message' },
      { from: /createResult2\.error\.message/g, to: 'createResult2.getError().message' }
    ]
  },
  {
    file: 'DeleteOrderHandler.test.ts',
    rules: [
      { from: /result\.value/g, to: 'result.getValue()' },
      { from: /result\.error/g, to: 'result.getError()' },
      { from: /found\.value/g, to: 'found.getValue()' }
    ]
  }
];

for (const rep of replacements) {
  const fullPath = path.join(srcDir, rep.file);
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
