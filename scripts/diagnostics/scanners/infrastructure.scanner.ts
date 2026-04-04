
import * as fs from 'fs';
import * as path from 'path';
import type { Scanner, ScanResult, Finding } from '../types';

export class InfrastructureScanner implements Scanner {
  name = 'infrastructure';
  description = 'Conectividad y salud de servicios externos (DB, Redis, AI)';
  weight = 1.3;

  async scan(): Promise<ScanResult> {
    const findings: Finding[] = [];

    // Check 1: Supabase client está correctamente configurado
    findings.push(...this.checkSupabaseConfig());

    // Check 2: Redis/BullMQ configuración
    findings.push(...this.checkRedisConfig());

    // Check 3: AI Services configuración
    findings.push(...this.checkAIServicesConfig());

    // Check 4: Adaptadores implementan los puertos correctamente
    findings.push(...this.checkAdapterImplementations());

    // Check 5: Error handling en adaptadores
    findings.push(...this.checkAdapterErrorHandling());

    // Check 6: Hardcoded credentials
    findings.push(...this.checkHardcodedSecrets());

    // Check 7: Connection pooling / singleton patterns
    findings.push(...this.checkConnectionPatterns());

    // Check 8: Retry/timeout patterns
    findings.push(...this.checkResiliencePatterns());

    const criticalCount = findings.filter(
      (f) => f.severity === 'critical',
    ).length;
    const score = Math.max(
      0,
      100 - criticalCount * 20 - findings.length * 3,
    );

    return {
      scanner: this.name,
      status: criticalCount > 0 ? 'fail' : 'pass',
      score: Math.round(score),
      duration: 0,
      findings,
      summary: `${findings.length} hallazgos en infraestructura`,
    };
  }

  private checkSupabaseConfig(): Finding[] {
    const findings: Finding[] = [];
    const infraPath = 'src/infrastructure';
    const files = this.getFilesRecursive(infraPath);

    for (const file of files) {
      if (!file.includes('supabase') && !file.includes('Supabase'))
        continue;
      if (file.includes('.test.')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar .from() en lo que parece ser una promesa sin await.
        // Se ignora si es parte de 'this.supabase', 'this.client', Repository o Adapter (Inyección de Dependencias).
        const isSafePattern = 
          line && (line.includes('this.supabase') || 
          line.includes('this.client') || 
          file.endsWith('Repository.ts') ||
          file.endsWith('Adapter.ts'));

        if (
          line && line.includes('.from(') &&
          !line.includes('await') &&
          !isSafePattern &&
          lines[Math.max(0, i - 1)]?.includes('await') === false
        ) {
          // Verificar contexto estrictamente
          const prevLines = lines
            .slice(Math.max(0, i - 3), i)
            .join(' ');
          
          if (
            prevLines.includes('createClient') ||
            prevLines.includes('Promise') ||
            prevLines.includes('then(')
          ) {
            findings.push({
              id: `supa-promise-${file}-${i}`,
              scanner: this.name,
              severity: 'high',
              title: 'Posible .from() en Promise sin resolver',
              description: `Verificar que el cliente Supabase está awaited antes de .from(): ${line.trim().substring(0, 80)}`,
              file,
              line: i + 1,
              suggestion:
                'Asegurar: const supabase = await createClient(); supabase.from(...)',
              autoFixable: false,
              category: 'supabase',
            });
          }
        }

        // Detectar .single() sin verificación de error
        if (
          line && line.includes('.single()') &&
          !lines
            .slice(i, Math.min(lines.length, i + 5))
            .some((l) => l && (l.includes('error') || l.includes('Error')))
        ) {
          findings.push({
            id: `supa-single-${file}-${i}`,
            scanner: this.name,
            severity: 'medium',
            title: 'Supabase .single() sin manejo de error',
            description:
              '.single() puede retornar error si no hay resultados o hay múltiples',
            file,
            line: i + 1,
            suggestion:
              'Verificar { data, error } después de .single() y manejar null',
            autoFixable: false,
            category: 'supabase',
          });
        }
      }
    }

    return findings;
  }

  private checkHardcodedSecrets(): Finding[] {
    const findings: Finding[] = [];
    const allFiles = this.getFilesRecursive('src');

    const secretPatterns = [
      {
        regex: /['"]sk-[a-zA-Z0-9]{20,}['"]/,
        desc: 'OpenAI API Key hardcodeada',
      },
      {
        regex: /['"]sk-ant-[a-zA-Z0-9]{20,}['"]/,
        desc: 'Anthropic API Key hardcodeada',
      },
      {
        regex: /['"]eyJ[a-zA-Z0-9._-]{50,}['"]/,
        desc: 'JWT/Supabase key hardcodeada',
      },
      {
        regex: /['"]redis:\/\/[^'"]+['"]/,
        desc: 'Redis URL hardcodeada',
      },
      {
        regex: /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
        desc: 'Password hardcodeado',
      },
    ];

    for (const file of allFiles) {
      if (
        file.includes('.test.') ||
        file.includes('.example') ||
        file.includes('node_modules')
      )
        continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim().startsWith('//') || line.trim().startsWith('*'))
          continue;

        for (const pattern of secretPatterns) {
          if (pattern.regex.test(line)) {
            findings.push({
              id: `secret-${file}-${i}`,
              scanner: this.name,
              severity: 'critical',
              title: `🔐 ${pattern.desc}`,
              description: `Credencial detectada en código fuente. NUNCA commitear secrets.`,
              file,
              line: i + 1,
              suggestion:
                'Mover a variable de entorno: process.env.VARIABLE_NAME',
              autoFixable: false,
              category: 'security',
            });
          }
        }
      }
    }

    return findings;
  }

  private checkAdapterErrorHandling(): Finding[] {
    const findings: Finding[] = [];
    const infraFiles = this.getFilesRecursive('src/infrastructure');

    for (const file of infraFiles) {
      if (file.includes('.test.') || file.includes('.d.ts')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Detectar throw en adaptadores (deberían retornar Result)
        if (
          /throw\s+new\s+Error/.test(line) &&
          !line.trim().startsWith('//')
        ) {
          findings.push({
            id: `throw-infra-${file}-${i}`,
            scanner: this.name,
            severity: 'medium',
            title: 'throw en Infrastructure adapter',
            description:
              'Los adaptadores deben retornar Result.fail(), no lanzar excepciones',
            file,
            line: i + 1,
            suggestion:
              'Reemplazar throw con return Result.fail(new AppError(...))',
            autoFixable: false,
            category: 'error-handling',
          });
        }

        // Detectar catch vacío
        if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
          findings.push({
            id: `empty-catch-${file}-${i}`,
            scanner: this.name,
            severity: 'high',
            title: 'Catch block vacío — errores silenciados',
            description:
              'Los errores se están tragando silenciosamente',
            file,
            line: i + 1,
            suggestion:
              'Loguear el error o retornar Result.fail()',
            autoFixable: false,
            category: 'error-handling',
          });
        }
      }
    }

    return findings;
  }

  private checkRedisConfig(): Finding[] {
    return [];  // Implementar según tu setup
  }

  private checkAIServicesConfig(): Finding[] {
    return [];  // Implementar según tu setup
  }

  private checkAdapterImplementations(): Finding[] {
    return [];  // Verificar que cada puerto tiene su adaptador
  }

  private checkConnectionPatterns(): Finding[] {
    return [];  // Verificar singleton/pooling
  }

  private checkResiliencePatterns(): Finding[] {
    return [];  // Verificar retry/timeout/circuit breaker
  }

  private getFilesRecursive(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next')
          continue;
        files.push(...this.getFilesRecursive(fullPath));
      } else if (
        entry.name.endsWith('.ts') ||
        entry.name.endsWith('.tsx')
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }
}
