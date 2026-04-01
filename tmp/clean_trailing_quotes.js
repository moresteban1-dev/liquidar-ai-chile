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
    let content = rawContent;
    let changed = false;

    // Fix trailing ''; or '' at the end of imports
    // Regex matches '@something''; or "@something"'; or '@something''
    const trailingRegex = /from\s+(['"])([^'"]+)(['"])(['"]?)(;?)/g;
    content = content.replace(trailingRegex, (match, q1, p1, q2, q3, p3) => {
        if (q3 || q1 !== q2) {
            changed = true;
            return `from '${p1}'${p3}`;
        }
        return match;
    });

    // Specific fix for the React import mistake: import * as React from 'react''
    const reactRegex = /import\s+\*\s+as\s+React\s+from\s+['"]react['"]['"]?;?/g;
    if (reactRegex.test(content)) {
        changed = true;
        content = content.replace(reactRegex, "import * as React from 'react';");
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Deep cleaned quotes: ${path.relative(process.cwd(), file)}`);
    }
});

console.log('Done.');
