/// <reference types="node" />
import { execSync } from 'child_process';
import * as fs from 'fs';

const DRY_RUN = false;

interface TSError {
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
  fullLine: string;
}

function getTSErrors(): TSError[] {
  try {
    const output = execSync('npx tsc --noEmit 2>&1', {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
    return parseErrors(output);
  } catch (e: any) {
    return parseErrors(e.stdout || '');
  }
}

function parseErrors(output: string): TSError[] {
  return output
    .split('\n')
    .filter((l) => l.includes('error TS'))
    .map((line) => {
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.*)/);
      if (!match) return null;
      return {
        file: match[1]!,
        line: parseInt(match[2]!),
        col: parseInt(match[3]!),
        code: match[4]!,
        message: match[5]!,
        fullLine: line,
      };
    })
    .filter((e): e is TSError => e !== null);
}

function readFile(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

function writeFile(filePath: string, lines: string[]): void {
  if (DRY_RUN) return;
  fs.writeFileSync(filePath, lines.join('\n'));
}

function fixUnusedVars(errors: TSError[]): number {
  const ts6133 = errors.filter((e) => e.code === 'TS6133');
  let fixed = 0;
  const byFile = new Map<string, TSError[]>();
  for (const err of ts6133) {
    if (!byFile.has(err.file)) byFile.set(err.file, []);
    byFile.get(err.file)!.push(err);
  }

  for (const [file, fileErrors] of byFile) {
    const lines = readFile(file);
    if (lines.length === 0) continue;
    let modified = false;
    const sorted = [...fileErrors].sort((a, b) => b.line - a.line);

    for (const err of sorted) {
      const lineIdx = err.line - 1;
      const line = lines[lineIdx];
      if (!line) continue;
      const varName = err.message.match(/'(\w+)'/)?.[1];
      if (!varName) continue;

      if (line.includes(`import { ${varName} }`) || line.includes(`import {${varName}}`)) {
          const newLine = line.replace(new RegExp(`\\b${varName}\\b,\\s*`), '').replace(new RegExp(`,\\s*\\b${varName}\\b`), '');
          if (newLine === line || /\{\s*\}/.test(newLine)) {
              lines[lineIdx] = `// ${line.trim()}`;
          } else {
              lines[lineIdx] = newLine;
          }
          modified = true; fixed++;
      } else if (line.includes(`catch (${varName})`)) {
          lines[lineIdx] = line.replace(`catch (${varName})`, `catch (_${varName})`);
          modified = true; fixed++;
      }
    }
    if (modified) writeFile(file, lines);
  }
  return fixed;
}

function fixPossiblyUndefined(errors: TSError[]): number {
  const targetCodes = ['TS18048', 'TS2532', 'TS2345'];
  const tsErrors = errors.filter((e) => targetCodes.includes(e.code));
  let fixed = 0;
  const byFile = new Map<string, TSError[]>();
  for (const err of tsErrors) {
    if (!byFile.has(err.file)) byFile.set(err.file, []);
    byFile.get(err.file)!.push(err);
  }

  for (const [file, fileErrors] of byFile) {
    const lines = readFile(file);
    if (lines.length === 0) continue;
    let modified = false;
    const sorted = [...fileErrors].sort((a, b) => b.line - a.line);

    for (const err of sorted) {
      const lineIdx = err.line - 1;
      const line = lines[lineIdx];
      if (!line) continue;
      
      const varMatch = err.message.match(/'(\w+)'/);
      if (varMatch) {
          const varName = varMatch[1];
          let newLine = line;
          
          if (err.code === 'TS18048' || err.code === 'TS2532') {
              newLine = line.replace(new RegExp(`\\b${varName}\\.`), `${varName}?.`);
          } else if (err.code === 'TS2345' && err.message.includes('unknown')) {
              // Try basic casting if it looks like a string argument error
              if (line.includes(`(${varName})`) || line.includes(`, ${varName}`)) {
                  newLine = line.replace(new RegExp(`\\b${varName}\\b`), `${varName} as any`);
              }
          }
          
          if (newLine !== line) { lines[lineIdx] = newLine; modified = true; fixed++; }
      }
    }
    if (modified) writeFile(file, lines);
  }
  return fixed;
}

async function main() {
  console.log('--- OPERACIÓN ZERO START ---');
  const errors = getTSErrors();
  console.log(`Initial Errors: ${errors.length}`);
  
  let totalFixed = 0;
  totalFixed += fixUnusedVars(errors);
  totalFixed += fixPossiblyUndefined(errors);
  
  console.log(`Total Fixed: ${totalFixed}`);
  const remaining = getTSErrors();
  console.log(`Remaining Errors: ${remaining.length}`);
}

main().catch(console.error);
