const fs = require('fs');
const path = require('path');

const targetFiles = [
    'src/app/api/admin/calendar/route.ts',
    'src/app/api/categories/[id]/route.ts',
    'src/app/api/client/quotations/[id]/route.ts',
    'src/app/api/client/quotations/route.ts',
    'src/app/api/client/stats/route.ts',
    'src/app/api/config/route.ts',
    'src/app/api/orders/[id]/transition/route.ts',
    'src/app/api/services/[id]/route.ts',
    'src/app/api/stats/route.ts',
    'src/app/api/vendor/quotations/[id]/route.ts',
    'src/app/api/vendor/stats/route.ts'
];

for (const relPath of targetFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
        console.warn('Skipping missing file:', fullPath);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Pattern 1: `const supabase = await createApiClient();`
    const pattern1 = /const supabase = await createApiClient\(\);/g;
    const replacement1 = `const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();`;

    content = content.replace(pattern1, replacement1);

    // Pattern 2: `const supabase = await createServiceRoleClient();` -> NOT NEEDED unless the signature changed, but `createServiceRoleClient` does NOT return a Result.

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed:', relPath);
}
