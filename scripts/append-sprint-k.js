// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const f = 'C:/Users/Esteban/.gemini/antigravity/brain/518a021d-e3af-4bf3-9694-600a81e37da5/task.md';
let c = fs.readFileSync(f, 'utf8');

const s = `
## Sprint K — Performance & UX
- [ ] K1: Streaming con \`loading.tsx\` por ruta
- [ ] K2: ISR para catálogo de servicios
- [ ] K3: Image optimization (next/image en landing)
- [ ] K4: Bundle analysis + dynamic imports
`;

fs.writeFileSync(f, c + '\n' + s, 'utf8');
console.log('Appended Sprint K to task.md');
