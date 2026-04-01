const { exec } = require('child_process');
const fs = require('fs');

console.log('Running tsc --noEmit...');
exec('npx tsc --noEmit', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const output = [stdout, stderr].filter(Boolean).join('\n');
    fs.writeFileSync('tsc_final_check.txt', output, 'utf8');
    
    if (error) {
        console.log(`Compilation finished with errors. Wrote to tsc_final_check.txt (Length: ${output.length} characters)`);
    } else {
        console.log('Compilation SUCCESS! Zero TSC errors. Wrote to tsc_final_check.txt');
    }
});
