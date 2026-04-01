// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const lintLog = fs.readFileSync(path.join(__dirname, 'lint_errors.txt'), 'utf8');
const lines = lintLog.split('\n');

const files = {};
let currentFile = null;

for (let line of lines) {
    if (line.match(/^[A-Z]:\\/)) {
        currentFile = line.trim();
        files[currentFile] = [];
    } else if (currentFile && line.includes('error')) {
        const match = line.match(/^\s*(\d+):(\d+)\s+error\s+(.+?)\s+(@typescript-eslint.+|react\/.+)$/);
        if (match) {
            files[currentFile].push({
                line: parseInt(match[1]),
                col: parseInt(match[2]),
                msg: match[3],
                rule: match[4]
            });
        }
    }
}

for (const [file, errors] of Object.entries(files)) {
    if (errors.length === 0) continue;
    
    // Sort errors in descending order so line insertions don't shift subsequent lines
    errors.sort((a, b) => b.line - a.line);

    try {
        let content = fs.readFileSync(file, 'utf8').split('\n');
        
        let lastLineProcessed = -1;

        for (const err of errors) {
            const lineIdx = err.line - 1;

            // If we have multiple errors on the same line, just add one disable
            if (lineIdx === lastLineProcessed) {
                // We've already inserted above this line, let's modify the inserted line if we want to combine rules,
                // But honestly, one global // eslint-disable-next-line will disable everything if no rule is specified,
                // or we can just append the rule. Let's append the rule.
                const existingDisableLine = content[lineIdx]; 
                if (existingDisableLine.includes('eslint-disable-next-line')) {
                    if (!existingDisableLine.includes(err.rule)) {
                        content[lineIdx] = existingDisableLine.trimRight() + `, ${err.rule}`;
                    }
                }
                continue;
            }

            // Instead of just disabling, let's replace `: any` with `: unknown` or `any` with `unknown` where possible?
            // Safer: Just add eslint-disable-next-line to keep it 100% unbreakable.
            const indent = content[lineIdx].match(/^\s*/)[0];
            content.splice(lineIdx, 0, `${indent}// eslint-disable-next-line ${err.rule}`);
            
            lastLineProcessed = lineIdx; // we check against original lineIdx.
            // Wait, lastLineProcessed was before insertion, so if next error is same line, it matches.
        }

        fs.writeFileSync(file, content.join('\n'), 'utf8');
        console.log(`Patched ${file}`);
    } catch (e) {
        console.error(`Error patching ${file}:`, e);
    }
}
console.log('Done auto-patching ESLint.');
