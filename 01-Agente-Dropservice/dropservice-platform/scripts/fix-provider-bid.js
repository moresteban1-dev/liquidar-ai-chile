// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const file = 'src/actions/provider-bid.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ 2\. Validate inputs\s*const validationError = validateItems\(input\.items\);/;

const replacement = `// 1b. Sanitize inputs against XSS (H4)
        const { sanitizeRichText, sanitizePlainText } = await import('@/lib/security/xss');
        if (input.providerNotes) {
            input.providerNotes = sanitizeRichText(input.providerNotes);
        }
        for (const item of input.items) {
            item.concept = sanitizePlainText(item.concept);
        }

        // 2. Validate inputs
        const validationError = validateItems(input.items);`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('H4: Successfully injected XSS sanitization in provider-bid.ts');
} else {
    console.error('H4: target not found in provider-bid.ts');
}
