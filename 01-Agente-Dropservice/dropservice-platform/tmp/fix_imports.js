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
console.log(`Scanning: ${srcDir}`);
const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // 1. Fix casing of StructuredLogger in imports
    content = content.replace(/structured-logger/g, 'StructuredLogger');
    
    // 2. Fix old directory path for telemetry
    content = content.replace(/\.\.\/observability\//g, '../telemetry/');
    
    // 3. Fix any mismatched quotes that might have survived (safety)
    content = content.replace(/from\s+\"([^'']+)\'/g, "from '$1'");
    content = content.replace(/from\s+'([^'']+\")/g, "from '$1'");

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(process.cwd(), file)}`);
    }
});

console.log('Done.');
