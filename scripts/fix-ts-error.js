// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

const f = 'src/infrastructure/persistence/supabase/SupabaseQuoteSessionRepository.ts';
let lines = fs.readFileSync(f, 'utf8').split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('logger.warn(`QuoteSession ${id} not found or error:`, error);')) {
        lines[i] = lines[i].replace(
            'logger.warn(`QuoteSession ${id} not found or error:`, error);',
            'logger.warn(`QuoteSession ${id} not found or error:`, { error: error?.message });'
        );
        replaced = true;
    }
}

if (replaced) {
    fs.writeFileSync(f, lines.join('\n'), 'utf8');
    console.log('Successfully replaced line in ' + f);
} else {
    console.log('Line not found in ' + f);
}
