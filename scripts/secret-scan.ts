/* eslint-disable */
import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const PATTERNS = [
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
    { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
    { name: 'Supabase Service Role', regex: /eyJ[a-zA-Z0-9\\-_]+\.eyJ[a-zA-Z0-9\\-_]+\.eyJ[a-zA-Z0-9\\-_]+/ }, // Crude JWT check, refine if needed
    { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
];

const IGNORED_DIRS = ['node_modules', '.git', '.next', 'dist', 'coverage', '.gemini'];
const IGNORED_EXTS = ['.png', '.jpg', '.jpeg', '.svg', '.ico', '.lock', '.json'];

function scanFile(filePath: string) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        let hasSecret = false;

        PATTERNS.forEach(pattern => {
            if (pattern.regex.test(content)) {
                console.log(`${RED}[FAIL] ${pattern.name} found in ${filePath}${RESET}`);
                hasSecret = true;
            }
        });

        return hasSecret;
    } catch (_err) {
        // Binary files or read errors
        return false;
    }
}

function walkDir(dir: string): boolean {
    let clean = true;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (IGNORED_DIRS.includes(file)) continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!walkDir(fullPath)) clean = false;
        } else {
            if (IGNORED_EXTS.includes(path.extname(file))) continue;
            if (fullPath.endsWith('secret-scan.ts')) continue; // Ignore self

            if (scanFile(fullPath)) {
                clean = false;
            }
        }
    }
    return clean;
}

console.log('🔍 Starting Secret Scan...');
const isClean = walkDir(process.cwd());

if (isClean) {
    console.log(`${GREEN}✅ No hardcoded secrets found.${RESET}`);
    process.exit(0);
} else {
    console.log(`${RED}❌ Secrets detached! remove them immediately.${RESET}`);
    process.exit(1);
}
