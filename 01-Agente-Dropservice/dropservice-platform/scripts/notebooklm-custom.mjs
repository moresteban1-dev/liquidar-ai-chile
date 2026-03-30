import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { NotebookLMClient } from '../node_modules/antigravity-notebooklm-mcp/build/api-client.js';
import fs from 'fs';
import path from 'path';

// Helper to load auth
function loadAuth() {
    const paths = [
        path.join(process.cwd(), 'auth.json'),
        path.join(process.env.HOME || process.env.USERPROFILE || "", ".notebooklm-mcp", "auth.json"),
        // Also try looking in the directory where the script is located (for build folder context)
        path.resolve(path.dirname(process.argv[1]), '../auth.json'),
        path.resolve(path.dirname(process.argv[1]), '../../auth.json')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) {
            try {
                const content = fs.readFileSync(p, 'utf-8');
                return JSON.parse(content);
            }
            catch (e) {
                console.error("Error reading auth file:", p, e);
            }
        }
    }
    return null;
}

const server = new Server({ name: "notebooklm", version: "6.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
            name: "list_all_notebooks",
            description: "Escanea y lista la totalidad de tus cuadernos en NotebookLM",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_notebook_sources",
            description: "Obtiene los detalles y fuentes de un cuaderno específico",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string", description: "ID del cuaderno" }
                },
                required: ["id"]
            }
        },
        {
            name: "query_notebook",
            description: "Realiza una consulta de lenguaje natural a un cuaderno de NotebookLM (Grounded AI)",
            inputSchema: {
                type: "object",
                properties: {
                    id: { type: "string", description: "ID del cuaderno" },
                    query: { type: "string", description: "La pregunta o tarea a realizar" }
                },
                required: ["id", "query"]
            }
        }],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query_notebook") {
        const auth = loadAuth();
        if (!auth) {
            return {
                content: [{ type: "text", text: "Error: No se encontró auth.json." }],
                isError: true
            };
        }
        const client = new NotebookLMClient({
            cookies: auth.cookies,
            csrfToken: auth.csrfToken,
            sessionId: auth.sessionId
        });
        const { id, query } = request.params.arguments;
        try {
            const response = await client.query(id, query);
            // The query returns streamed data, we need a simple parser for the text blocks.
            // For now return the raw text extracted from the stream.
            const cleanText = response.replace(/\)\]\}'[\s\S]*?\[/g, '[').replace(/\\n/g, '\n').replace(/\\"/g, '"');
            return {
                content: [{ type: "text", text: cleanText }]
            };
        }
        catch (e) {
            return {
                content: [{ type: "text", text: `Error en la consulta: ${e.message}` }],
                isError: true
            };
        }
    }
    if (request.params.name === "list_all_notebooks") {
        const auth = loadAuth();
        if (!auth) {
            return {
                content: [{ type: "text", text: "Error: No se encontró auth.json. Asegúrate de configurar las credenciales en la carpeta raíz o en ~/.notebooklm-mcp/auth.json." }],
                isError: true
            };
        }
        // Support string or object cookies
        let cookieStr = auth.cookie || auth.cookies;
        if (typeof cookieStr === 'object') {
            cookieStr = Object.entries(cookieStr).map(([k, v]) => `${k}=${v}`).join('; ');
        }
        const client = new NotebookLMClient({
            cookies: cookieStr,
            csrfToken: auth.csrf_token || auth.csrfToken,
            sessionId: auth.session_id || auth.sessionId
        });
        try {
            const notebooks = await client.listNotebooks();
            // Check if "Secretos" is in the titles
            const match = notebooks.find((n) => n.title.toLowerCase().includes("secretos") || n.title.toLowerCase().includes("longevos"));
            let extraMsg = "";
            if (match) {
                extraMsg = `\n\n¡ENCONTRADO POTENCIAL!: ${match.title} (ID: ${match.id})`;
            }
            else {
                // Raw search fallback
                const RPC_IDS = { LIST_NOTEBOOKS: "wXbhsf" };
                const body = await client._buildRequestBody(RPC_IDS.LIST_NOTEBOOKS, [null, 2]);
                const url = client._buildUrl(RPC_IDS.LIST_NOTEBOOKS);
                const response = await client.client.post(url, body);
                const rawText = JSON.stringify(response.data);
                if (rawText.toLowerCase().includes("secretos") || rawText.toLowerCase().includes("longevos")) {
                    extraMsg = "\n\n¡Encontrado 'Secretos' o 'Longevos' en los datos crudos (RAW)!Esto significa que está allí pero no como un cuaderno principal o con otro formato.";
                    const idx = rawText.toLowerCase().indexOf("secretos");
                    const snippet = rawText.substring(Math.max(0, idx - 100), Math.min(rawText.length, idx + 200));
                    extraMsg += `\nContexto: ...${snippet}...`;
                }
                else {
                    extraMsg = "\n\nNo se encontró 'Secretos' ni 'Longevos' en los datos crudos de la lista.";
                }
            }
            const list = notebooks.map((n) => `- ${n.title} (ID: ${n.id})`).join('\n');
            return {
                content: [{
                        type: "text",
                        text: `Cuadernos encontrados (${notebooks.length}):\n\n${list}${extraMsg}`
                    }],
            };
        }
        catch (e) {
            return {
                content: [{ type: "text", text: `Error al obtener cuadernos: ${e.message}` }],
                isError: true
            };
        }
    }
    if (request.params.name === "get_notebook_sources") {
        const auth = loadAuth();
        if (!auth) {
            return {
                content: [{ type: "text", text: "Error: No se encontró auth.json." }],
                isError: true
            };
        }
        let cookieStr = auth.cookie || auth.cookies;
        if (typeof cookieStr === 'object') {
            cookieStr = Object.entries(cookieStr).map(([k, v]) => `${k}=${v}`).join('; ');
        }
        const client = new NotebookLMClient({
            cookies: cookieStr,
            csrfToken: auth.csrf_token || auth.csrfToken,
            sessionId: auth.session_id || auth.sessionId
        });
        const notebookId = request.params.arguments.id;
        if (!notebookId) {
            return { content: [{ type: "text", text: "Error: Falta el ID del cuaderno" }], isError: true };
        }
        try {
            const notebook = await client.getNotebook(notebookId);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(notebook, null, 2)
                    }]
            };
        }
        catch (e) {
            return {
                content: [{ type: "text", text: `Error al leer cuaderno: ${e.message}` }],
                isError: true
            };
        }
    }
    return { content: [{ type: "text", text: "Error: Herramienta desconocida" }], isError: true };
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
