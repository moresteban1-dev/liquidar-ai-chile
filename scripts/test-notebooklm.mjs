import { NotebookLMClient } from '../node_modules/antigravity-notebooklm-mcp/build/api-client.js';
import fs from 'fs';

const auth = JSON.parse(fs.readFileSync('./auth.json', 'utf8'));

const client = new NotebookLMClient({
    cookies: auth.cookies,
    csrfToken: auth.csrfToken,
    sessionId: auth.sessionId
});

async function test() {
    try {
        console.log("Fetching notebooks...");
        const notebooks = await client.listNotebooks();
        console.log(`Found ${notebooks.length} notebooks:`);
        notebooks.forEach(n => console.log(`- ${n.title} (${n.id})`));
        
        const secrets = notebooks.filter(n => n.title.toLowerCase().includes('secretos'));
        if (secrets.length > 0) {
            console.log("\nMATCH FOUND for 'Secretos':");
            secrets.forEach(n => console.log(`- ${n.title}`));
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

test();
