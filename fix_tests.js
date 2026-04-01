const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'tests'));
let modified = 0;

files.forEach(f => {
    const original = fs.readFileSync(f, 'utf8');
    const regex = /import\s+.*?from\s+['"]vitest['"];?(\r?\n)?/g;
    const newContent = original.replace(regex, '');
    
    if (original !== newContent) {
        fs.writeFileSync(f, newContent, 'utf8');
        modified++;
    }
});

console.log(`Fixed ${modified} files.`);
