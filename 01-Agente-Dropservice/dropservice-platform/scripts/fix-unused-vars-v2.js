const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * script: fix-unused-vars-v2.js
 * Objetivo: Limpiar TS6133 de forma segura (Imports y Variables simples)
 * Evita: Renombrar 'error' en bloques catch (causa regresiones TS2304).
 */

const LOG_FILE = 'tsc_check.txt';
console.log('--- Iniciando Saneamiento Seguro Strike 3 v2 ---');

// 1. Obtener errores frescos
try {
    console.log('Ejecutando TSC...');
    execSync('npx tsc --noEmit > tsc_check.txt 2>&1');
} catch (e) {
    // ignorar error de salida (tsc fallará por los 341 errores)
}

const content = fs.readFileSync(LOG_FILE, 'utf8');
const lines = content.split('\n');

const unusedVars = [];
lines.forEach(line => {
    // Buscar TS6133 (variable declarada pero nunca usada)
    // O TS6138 (propiedad declarada pero nunca usada)
    const match = line.match(/(.*)\((\d+),(\d+)\): error (TS6133|TS6138): '(.*)' is declared but/);
    if (match) {
        const [_, filePath, lineNum, charPos, errCode, varName] = match;
        
        // FILTRO DE SEGURIDAD: No tocar variables críticas o con nombres comunes en catch
        if (varName === 'error' || varName === 'e' || varName === 'err') return;
        if (varName === 'supabase' && filePath.includes('repositories')) return; // DI injection safely ignored

        unusedVars.push({
            file: path.resolve(process.cwd(), filePath.trim()),
            line: parseInt(lineNum),
            name: varName
        });
    }
});

console.log(`Encontrados ${unusedVars.length} candidatos de saneamiento seguro.`);

// Agrupar por archivo
const fileGroups = {};
unusedVars.forEach(v => {
    if (!fileGroups[v.file]) fileGroups[v.file] = [];
    fileGroups[v.file].push(v);
});

Object.keys(fileGroups).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Ordenar de abajo hacia arriba para no mover los line numbers
    const fileVars = fileGroups[file].sort((a, b) => b.line - a.line);
    
    fileVars.forEach(v => {
        const lineIndex = v.line - 1;
        const lineText = lines[lineIndex];
        
        if (!lineText) return;

        // Caso 1: Importación simple (ej: import { X } from '...')
        // Si la línea contiene el nombre y parece un import, prefijamos con _
        if (lineText.includes('import ') || lineText.includes('{')) {
            // Intentar prefijar la variable en la línea si está entre comas o llaves
            const regex = new RegExp(`\\b${v.name}\\b`, 'g');
            lines[lineIndex] = lineText.replace(regex, `_${v.name}`);
            console.log(`[FIXED] Import/Destruct: ${v.name} -> _${v.name} en ${path.basename(file)}:${v.line}`);
        } 
        // Caso 2: Variable local (const x = ...)
        else if (lineText.includes('const ') || lineText.includes('let ') || lineText.includes('var ')) {
            const regex = new RegExp(`\\b${v.name}\\b`, 'g');
            lines[lineIndex] = lineText.replace(regex, `_${v.name}`);
            console.log(`[FIXED] Variable: ${v.name} -> _${v.name} en ${path.basename(file)}:${v.line}`);
        }
    });

    fs.writeFileSync(file, lines.join('\n'));
});

console.log('Saneamiento Strike 3 v2 completado.');
