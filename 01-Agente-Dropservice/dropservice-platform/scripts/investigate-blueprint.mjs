import { NotebookLMClient } from '../node_modules/antigravity-notebooklm-mcp/build/api-client.js';
import fs from 'fs';

const auth = JSON.parse(fs.readFileSync('./auth.json', 'utf8'));

const client = new NotebookLMClient({
    cookies: auth.cookies,
    csrfToken: auth.csrfToken,
    sessionId: auth.sessionId
});

const NOTEBOOK_ID = "68e74c2a-39e1-4fb5-a03d-e01058c05af5";

async function investigate() {
    try {
        console.log("Analyzing Technical Blueprint...");
        const response = await client.query(NOTEBOOK_ID, "Actúa como un Arquitecto de Software Senior. Basado en este cuaderno de 'Dropservice Platform: Technical Blueprint and Architectural Analysis', identifica los 5 puntos críticos donde la implementación actual puede mejorar. Enfócate en: 1. Escalabilidad de la base de datos. 2. Seguridad en las transacciones. 3. Experiencia del Desarrollador (DX). 4. Modularidad del código. 5. Integración de IA.");
        
        console.log("\n--- INFORME DE ANÁLISIS ---");
        console.log(response);
    } catch (e) {
        console.error("Investigation failed:", e.message);
    }
}

investigate();
