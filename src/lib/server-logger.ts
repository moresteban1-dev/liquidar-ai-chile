import fs from 'fs';
import path from 'path';

// Usaremos esta ruta para escribir los logs del endpoint y luego leerlos desde Playwright/Agente
export function logDiagnostic(message: string) {
    try {
        const logPath = path.join(process.cwd(), '.agent', 'api_diagnostic.log');
        fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
    } catch (error) {
        console.warn('Failed to dispatch server log to API:', error);
    }
}
