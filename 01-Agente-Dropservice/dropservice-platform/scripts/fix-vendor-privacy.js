// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

const FILE_PATH = 'src/lib/dashboard/vendor-data.service.ts';
let content = fs.readFileSync(FILE_PATH, 'utf-8');

// 1
content = content.replace(
    'client:profiles!quotations_client_id_fkey(name),',
    ''
);

// 2
content = content.replace(
    'client: { name: string } | { name: string }[] | null;',
    ''
);

// 3
content = content.replace(
    'const clientData = Array.isArray(q.client) ? q.client[0] : q.client;',
    ''
);

// 4
content = content.replace(
    "clientName: clientData?.name ?? 'Cliente',",
    "clientName: 'Confidencial',"
);

fs.writeFileSync(FILE_PATH, content, 'utf-8');
console.log('Fixed vendor-data.service.ts');
