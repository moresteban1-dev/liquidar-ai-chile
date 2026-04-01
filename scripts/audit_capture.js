// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const tsLog = path.join(__dirname, 'ts_errors.txt');
const lintLog = path.join(__dirname, 'lint_errors.txt');

try {
  console.log('Running TS Compiler...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  fs.writeFileSync(tsLog, 'No TS errors.\n');
} catch (e) {
  fs.writeFileSync(tsLog, e.stdout ? e.stdout.toString() : e.message);
  console.log('TS Compiler found errors.');
}

try {
  console.log('Running ESLint...');
  execSync('npx eslint .', { stdio: 'pipe' });
  fs.writeFileSync(lintLog, 'No ESLint errors.\n');
} catch (e) {
  fs.writeFileSync(lintLog, e.stdout ? e.stdout.toString() : e.message);
  console.log('ESLint found errors.');
}
