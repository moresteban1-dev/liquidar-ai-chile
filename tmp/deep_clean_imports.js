const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const srcDir = path.resolve(process.cwd(), 'src');
const files = walk(srcDir);

files.forEach(file => {
    const rawContent = fs.readFileSync(file, 'utf8');
    let lines = rawContent.split(/\r?\n/);
    let changed = false;

    lines = lines.map(line => {
        // Fix static imports: import ... from '@path' or "path" or 'path" etc.
        // We look for 'from' followed by any quoted string
        const fromRegex = /(from\s+)(['"])([^'"]+)(['"])(;?)/;
        if (fromRegex.test(line)) {
            changed = true;
            return line.replace(fromRegex, (match, p1, q1, p2, q2, p3) => {
                // If quotes are mixed or there's excess, p2 is the path
                // But sometimes p2 itself has quotes due to greedy matching
                const cleanPath = p2.replace(/['"]/g, '');
                return `${p1}'${cleanPath}'${p3}`;
            });
        }

        // Fix dynamic imports: import('path')
        const dynamicRegex = /(import\()(['"])([^'"]+)(['"])(\))/;
        if (dynamicRegex.test(line)) {
            changed = true;
            return line.replace(dynamicRegex, (match, p1, q1, p2, q2, p3) => {
                const cleanPath = p2.replace(/['"]/g, '');
                return `${p1}'${cleanPath}'${p3}`;
            });
        }
        
        // Legacy tailing quote fix (e.g. from "path"'; )
        if (line.includes('from "') || line.includes("from '")) {
             // Second attempt if first regex missed complex cases
             const secondRegex = /from\s+['"](.+?)['"]['"]?\s*;/;
             if (secondRegex.test(line)) {
                 changed = true;
                 return line.replace(secondRegex, (match, p1) => {
                     const cleanPath = p1.replace(/['"]/g, '');
                     return `from '${cleanPath}';`;
                 });
             }
        }

        return line;
    });

    if (changed) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
        console.log(`Cleaned: ${path.relative(process.cwd(), file)}`);
    }
});

console.log('Done.');
