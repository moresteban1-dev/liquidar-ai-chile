
import * as fs from 'fs';
import * as path from 'path';
import type { Scanner, ScanResult, Finding } from '../types';

export class SecurityScanner implements Scanner {
  name = 'security';
  description = 'OWASP & Seguridad — Inyección, Auth, Protecciones';
  weight = 1.4;

  async scan(): Promise<ScanResult> {
    const findings: Finding[] = [];

    // Check 1: Inyección SQL (Supabase raw queries)
    findings.push(...this.checkSqlInjection());

    // Check 2: XSS (dangerouslySetInnerHTML)
    findings.push(...this.checkXssPatterns());

    // Check 3: Auth zanjas (endpoints sin middleware/auth check)
    findings.push(...this.checkUnprotectedRoutes());

    // Check 4: Sensitive logging
    findings.push(...this.checkSensitiveLogging());

    // Check 5: Path traversal
    findings.push(...this.checkPathTraversal());

    const criticalCount = findings.filter(
      (f) => f.severity === 'critical',
    ).length;
    const score = Math.max(
      0,
      100 - criticalCount * 25 - findings.length * 5,
    );

    return {
      scanner: this.name,
      status: criticalCount > 0 ? 'fail' : 'pass',
      score: Math.round(score),
      duration: 0,
      findings,
      summary: `${findings.length} hallazgos de seguridad`,
    };
  }

  private checkSqlInjection(): Finding[] {
    const findings: Finding[] = [];
    const files = this.getFilesRecursive('src');

    for (const file of files) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar template literals en .rpc() o .raw() si existiera
        if (line &&
          (line.includes('.rpc(') || line.includes('query(')) &&
          line.includes('`') &&
          line.includes('${')
        ) {
          findings.push({
            id: `sqli-${file}-${i}`,
            scanner: this.name,
            severity: 'critical',
            title: 'Posible Inyección SQL via Template Literal',
            description: `Detectado uso de variables dinámicas en query string: ${line.trim().substring(0, 80)}`,
            file,
            line: i + 1,
            suggestion:
              'Usar parámetros bindeados o las funciones safe del SDK de Supabase',
            autoFixable: false,
            category: 'sql-injection',
          });
        }
      }
    }

    return findings;
  }

  private checkXssPatterns(): Finding[] {
    const findings: Finding[] = [];
    const files = this.getFilesRecursive('src');

    for (const file of files) {
      if (!file.endsWith('.tsx')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      if (content.includes('dangerouslySetInnerHTML')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line && line.includes('dangerouslySetInnerHTML')) {
            findings.push({
              id: `xss-${file}-${i}`,
              scanner: this.name,
              severity: 'high',
              title: 'Riesgo de XSS en Componente React',
              description:
                'Uso de dangerouslySetInnerHTML detectado',
              file,
              line: i + 1,
              suggestion:
                'Sanitizar el HTML con DOMPurify antes de renderizar o evitar su uso',
              autoFixable: false,
              category: 'xss',
            });
          }
        }
      }
    }

    return findings;
  }

  private checkUnprotectedRoutes(): Finding[] {
    const findings: Finding[] = [];
    const apiPath = 'src/app/api';
    if (!fs.existsSync(apiPath)) return findings;

    const routes = this.getFilesRecursive(apiPath).filter((f) =>
      f.endsWith('route.ts'),
    );

    for (const file of routes) {
      const filePath = file.replace(/\\/g, '/');
      
      // Ignorar rutas públicas conocidas
      if (
        filePath.includes('/public/') ||
        filePath.includes('/webhooks/') ||
        filePath.includes('/auth/callback') ||
        filePath.includes('/auth/verify') ||
        filePath.includes('/auth/register') ||
        filePath.includes('/auth/login') ||
        filePath.includes('/auth/forgot') ||
        filePath.includes('/auth/reset') ||
        filePath.includes('/categories') ||
        filePath.includes('/products') ||
        filePath.includes('/search') ||
        filePath.includes('/health') ||
        filePath.includes('/config') ||
        filePath.includes('/services') ||
        filePath.includes('/providers') ||
        filePath.includes('/stats') && !filePath.includes('/admin/') ||
        filePath.includes('/public-api')
      )
        continue;

      const content = fs.readFileSync(file, 'utf-8');

      // Verificar si llama a getSession, getServerSession o middleware patterns
      if (
        !content.includes('supabase.auth.getUser()') &&
        !content.includes('getServerSession') &&
        !content.includes('createRouteHandlerClient') &&
        !content.includes('adminRoute') &&
        !content.includes('withRole') &&
        !content.includes('withAuth') &&
        !content.includes('withAdmin') &&
        !content.includes('withInternalAuth') &&
        !content.includes('withWebhookAuth') &&
        !content.includes('withPublicApi')
      ) {
        findings.push({
          id: `unprotected-${file}`,
          scanner: this.name,
          severity: 'high',
          title: 'Ruta API posiblemente desprotegida',
          description: `No se detectó verificación de sesión en ${path.relative(process.cwd(), file)}`,
          file,
          suggestion:
            'Asegurar la ruta usando createRouteHandlerClient o verificando getUser()',
          autoFixable: false,
          category: 'access-control',
        });
      }
    }

    return findings;
  }

  private checkSensitiveLogging(): Finding[] {
    const findings: Finding[] = [];
    const allFiles = this.getFilesRecursive('src');

    const sensitivePatterns = [
      /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /secret\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /apiKey\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /credit_card\s*[:=]/i,
    ];

    for (const file of allFiles) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line &&
          (line.includes('console.log') ||
            line.includes('logger.info') ||
            line.includes('logger.debug')) &&
          sensitivePatterns.some((p) => p.test(line))
        ) {
          findings.push({
            id: `sensitive-log-${file}-${i}`,
            scanner: this.name,
            severity: 'medium',
            title: 'Posible log de datos sensibles',
            description: `Variable con nombre sensible detectada en log: ${line.trim().substring(0, 80)}`,
            file,
            line: i + 1,
            suggestion:
              'Nunca loguear passwords, tokens o keys. Usar placeholders o sanitizar.',
            autoFixable: false,
            category: 'data-leak',
          });
        }
      }
    }

    return findings;
  }

  private checkPathTraversal(): Finding[] {
    const findings: Finding[] = [];
    const files = this.getFilesRecursive('src');

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (
        (content.includes('fs.readFile') ||
          content.includes('fs.readFileSync')) &&
        content.includes('req.')
      ) {
        findings.push({
          id: `path-traversal-${file}`,
          scanner: this.name,
          severity: 'critical',
          title: 'Potencial Path Traversal',
          description: 'Lectura de archivos usando input del request',
          file,
          suggestion:
            'Normalizar y validar el path con path.resolve() y restringir al directorio esperado',
          autoFixable: false,
          category: 'injection',
        });
      }
    }

    return findings;
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
