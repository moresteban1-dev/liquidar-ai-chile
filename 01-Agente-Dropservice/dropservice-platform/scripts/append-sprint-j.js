// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
let c = fs.readFileSync('C:/Users/Esteban/.gemini/antigravity/brain/518a021d-e3af-4bf3-9694-600a81e37da5/task.md', 'utf8');

const s = `
## Sprint J — Architecture Unification
- [ ] J1: Separar \`actions/quotations.ts\` (445L) en módulos
- [ ] J2: Unificar \`use-cases/\` + \`usecases/\`
- [ ] J3: Migrar \`lib/services/\` a \`core/application/services/\`
- [ ] J4: Resolver 22 TODO/FIXME markers
`;

fs.writeFileSync('C:/Users/Esteban/.gemini/antigravity/brain/518a021d-e3af-4bf3-9694-600a81e37da5/task.md', c + '\n' + s, 'utf8');
console.log('Appended Sprint J to task.md');
