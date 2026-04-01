// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
const f = 'C:/Users/Esteban/.gemini/antigravity/brain/518a021d-e3af-4bf3-9694-600a81e37da5/task.md';
let c = fs.readFileSync(f, 'utf8');

const s = `
## Sprint L — Negocio & Producto
- [ ] L1: Flujo de pago E2E real (MercadoPago sandbox)
- [ ] L2: Notificaciones email transaccionales (Resend)
- [ ] L3: Dashboard analytics real-time
- [ ] L4: Multi-currency support
`;

fs.writeFileSync(f, c + '\n' + s, 'utf8');
console.log('Appended Sprint L to task.md');
