const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('npx vitest run tests/smoke.test.ts 2>&1', {
    cwd: 'c:/Users/Esteban/Desktop/Skill IA/01-Agente-Dropservice/dropservice-platform',
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
  });
  fs.writeFileSync('c:/Users/Esteban/Desktop/Skill IA/smoke_out.txt', result);
} catch (e) {
  fs.writeFileSync('c:/Users/Esteban/Desktop/Skill IA/smoke_out.txt', (e.stdout || '') + '\n' + (e.stderr || ''));
}
