// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const lintLog = fs.readFileSync(path.join(__dirname, 'lint_errors.txt'), 'utf8');
const lines = lintLog.split('\n');

const filesToFix = {};
let currentFile = null;

for (let line of lines) {
    if (line.match(/^[A-Z]:\\/)) {
        currentFile = line.trim();
        filesToFix[currentFile] = [];
    } else if (currentFile && line.includes('react/jsx-no-comment-textnodes')) {
        const match = line.match(/^\s*(\d+):(\d+)\s+error/);
        if (match) {
            filesToFix[currentFile].push(parseInt(match[1]));
        }
    }
}

for (const [file, errorLines] of Object.entries(filesToFix)) {
    if (errorLines.length === 0) continue;
    
    // Process unique lines in descending order
    const uniqueLines = [...new Set(errorLines)].sort((a, b) => b - a);

    try {
        let content = fs.readFileSync(file, 'utf8').split('\n');
        
        for (const lineNum of uniqueLines) {
            const lineIdx = lineNum - 1;
            const lineContent = content[lineIdx];
            
            // Just replace // eslint-disable... with {/* eslint-disable... */}
            // Be careful to keep indentation
            const match = lineContent.match(/^(\s*)\/\/\s*(eslint-disable-next-line.*)$/);
            if (match) {
                content[lineIdx] = `${match[1]}{/* ${match[2]} */}`;
            } else {
                // If it doesn't strictly match // eslint-disable, just wrap the whole non-whitespace thing
                const indentMatch = lineContent.match(/^(\s*)(.*)$/);
                if (indentMatch && indentMatch[2].startsWith('//')) {
                    content[lineIdx] = `${indentMatch[1]}{/* ${indentMatch[2].substring(2).trim()} */}`;
                }
            }
        }

        fs.writeFileSync(file, content.join('\n'), 'utf8');
        console.log(`Fixed JSX comments in ${file}`);
    } catch (e) {
        console.error(`Error fixing ${file}:`, e);
    }
}
