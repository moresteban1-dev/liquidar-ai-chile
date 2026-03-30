// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const files = [
    'src/actions/item-proposal.ts',
    'src/actions/provider-bid.ts',
    'src/actions/requote.ts',
    'src/actions/submit-feedback.ts',
    'src/app/admin/categories/page.tsx',
    'src/app/admin/quotations/[id]/page.tsx',
    'src/app/admin/services/page.tsx',
    'src/app/api/admin/proposals/route.ts',
    'src/app/api/auth/register/route.ts',
    'src/app/api/catalog/items/route.ts'
];
const imp = 'import { logger } from "@/infrastructure/observability/structured-logger";\n';

for (const f of files) {
    const fullPath = path.join(process.cwd(), f);
    if (!fs.existsSync(fullPath)) {
        console.log('Skipping (not found):', f);
        continue;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('import { logger }')) {
        const match = content.match(/^(?:'|")use (?:client|server)(?:'|");?/m);
        if (match && match.index !== undefined) {
            const p = match.index + match[0].length;
            content = content.slice(0, p) + '\n\n' + imp + content.slice(p);
        } else {
            content = imp + content;
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', f);
    } else {
        console.log('Already has import:', f);
    }
}
