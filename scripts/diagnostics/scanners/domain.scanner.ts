
import * as fs from 'fs';
import * as path from 'path';
import type { Scanner, ScanResult, Finding } from '../types';

export class DomainIntegrityScanner implements Scanner {
  name = 'domain-integrity';
  description =
    'Integridad DDD — Aggregates, Value Objects, Domain Events';
  weight = 1.2;

  private readonly DOMAIN_PATH = 'src/core/domain';
  private readonly APP_PATH = 'src/core/application';
  private readonly INFRA_PATH = 'src/infrastructure';

  async scan(): Promise<ScanResult> {
    const findings: Finding[] = [];

    // Check 1: Aggregates tienen factory methods
    findings.push(...this.checkAggregateFactories());

    // Check 2: Value Objects son inmutables
    findings.push(...this.checkValueObjectImmutability());

    // Check 3: Domain no importa de Infrastructure
    findings.push(...this.checkDependencyDirection());

    // Check 4: Repository ports están en domain
    findings.push(...this.checkRepositoryPorts());

    // Check 5: Domain Events existen
    findings.push(...this.checkDomainEvents());

    // Check 6: No hay lógica de negocio en infrastructure
    findings.push(...this.checkBusinessLogicLeaks());

    // Check 7: Aggregates usan Result pattern
    findings.push(...this.checkResultUsage());

    // Check 8: No hay `any` en domain layer
    findings.push(...this.checkAnyUsage());

    // Check 9: Entities tienen identity
    findings.push(...this.checkEntityIdentity());

    // Check 10: No hay console.log en domain
    findings.push(...this.checkConsoleUsage());

    const criticalFindings = findings.filter(
      (f) => f.severity === 'critical',
    );
    const score = Math.max(
      0,
      100 -
        criticalFindings.length * 15 -
        findings.filter((f) => f.severity === 'high').length * 8 -
        findings.filter((f) => f.severity === 'medium').length * 3,
    );

    return {
      scanner: this.name,
      status:
        criticalFindings.length > 0
          ? 'fail'
          : findings.length > 5
            ? 'warn'
            : 'pass',
      score: Math.round(score),
      duration: 0,
      findings,
      summary: `${findings.length} hallazgos en integridad de dominio`,
    };
  }

  private checkDependencyDirection(): Finding[] {
    const findings: Finding[] = [];
    const domainFiles = this.getFilesRecursive(this.DOMAIN_PATH);

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        // Domain NO debe importar de infrastructure
        if (
          line.includes('import') &&
          (line.includes('@infra/') ||
            line.includes('/infrastructure/') ||
            line.includes('supabase') ||
            line.includes('redis') ||
            line.includes('bullmq') ||
            line.includes('opentelemetry'))
        ) {
          findings.push({
            id: `dep-direction-${file}-${i}`,
            scanner: this.name,
            severity: 'critical',
            title:
              'Violación de Dependency Rule: Domain importa de Infrastructure',
            description: `El dominio no debe depender de detalles de infraestructura: ${line.trim()}`,
            file,
            line: i + 1,
            suggestion:
              'Mover la dependencia a un puerto (interface) en domain y el adaptador en infrastructure',
            autoFixable: false,
            category: 'architecture-violation',
          });
        }

        // Domain NO debe importar de presentation/UI
        if (
          line.includes('import') &&
          (line.includes('next/') ||
            line.includes('react') ||
            line.includes('@ui/'))
        ) {
          findings.push({
            id: `dep-direction-ui-${file}-${i}`,
            scanner: this.name,
            severity: 'critical',
            title:
              'Violación de Dependency Rule: Domain importa de UI',
            description: `El dominio no debe depender de frameworks UI: ${line.trim()}`,
            file,
            line: i + 1,
            suggestion:
              'El dominio debe ser puro — sin dependencias de framework',
            autoFixable: false,
            category: 'architecture-violation',
          });
        }
      }
    }

    return findings;
  }

  private checkAggregateFactories(): Finding[] {
    const findings: Finding[] = [];
    const aggregatePath = path.join(this.DOMAIN_PATH, 'aggregates');

    if (!fs.existsSync(aggregatePath)) {
      findings.push({
        id: 'no-aggregates-dir',
        scanner: this.name,
        severity: 'high',
        title: 'Directorio de Aggregates no encontrado',
        description: `Se esperaba: ${aggregatePath}`,
        suggestion: 'Crear el directorio y mover los aggregates ahí',
        autoFixable: false,
        category: 'structure',
      });
      return findings;
    }

    const files = this.getFilesRecursive(aggregatePath);
    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.'))
        continue;

      const content = fs.readFileSync(file, 'utf-8');
      const isAggregate = content.includes('class') && (content.includes('extends AggregateRoot') || content.includes('AggregateRoot<'));

      if (!isAggregate) continue;

      // Verificar que tiene factory method (create o reconstitute)
      if (
        !content.includes('static create') &&
        !content.includes('static reconstitute')
      ) {
        findings.push({
          id: `no-factory-${file}`,
          scanner: this.name,
          severity: 'medium',
          title: `Aggregate sin factory method: ${path.basename(file)}`,
          description:
            'Los aggregates deben usar static factory methods en vez de constructor público',
          file,
          suggestion:
            'Agregar static create() y/o static reconstitute() methods',
          autoFixable: false,
          category: 'ddd-pattern',
        });
      }

      // Verificar constructor privado
      if (
        content.includes('export class') &&
        !content.includes('private constructor') &&
        !content.includes('protected constructor')
      ) {
        findings.push({
          id: `public-constructor-${file}`,
          scanner: this.name,
          severity: 'medium',
          title: `Aggregate con constructor público: ${path.basename(file)}`,
          description:
            'Los aggregates deben tener constructor privado para forzar el uso de factory methods',
          file,
          suggestion:
            'Cambiar constructor a private y exponer static create()',
          autoFixable: false,
          category: 'ddd-pattern',
        });
      }
    }

    return findings;
  }

  private checkValueObjectImmutability(): Finding[] {
    const findings: Finding[] = [];
    const voPath = path.join(this.DOMAIN_PATH, 'value-objects');

    if (!fs.existsSync(voPath)) return findings;

    const files = this.getFilesRecursive(voPath);
    for (const file of files) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Detectar propiedades mutables (sin readonly) - Excluir métodos verificando que no haya '(' inmediatamente después del nombre
      const publicPropRegex =
        /^\s+public\s+(?!readonly|static|get\s|abstract)\b\w+\s*:(?!\s*\()/gm;
      let match: RegExpExecArray | null;
      while ((match = publicPropRegex.exec(content)) !== null) {
        const lineNum =
          content.substring(0, match.index).split('\n').length;
        findings.push({
          id: `mutable-vo-${file}-${lineNum}`,
          scanner: this.name,
          severity: 'high',
          title: `Value Object mutable: ${path.basename(file)}`,
          description: `Propiedad pública no-readonly detectada: ${match[0].trim()}`,
          file,
          line: lineNum,
          suggestion:
            'Los Value Objects deben ser inmutables. Agregar readonly a todas las propiedades.',
          autoFixable: true,
          category: 'ddd-pattern',
        });
      }

      // Detectar setters
      if (content.includes('set ') && content.includes('(')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line === undefined) continue;

          if (
            line.includes('set ') &&
            !line.trim().startsWith('//')
          ) {
            findings.push({
              id: `vo-setter-${file}-${i}`,
              scanner: this.name,
              severity: 'high',
              title: `Value Object con setter: ${path.basename(file)}`,
              description: `Los Value Objects no deben tener setters: ${line.trim()}`,
              file,
              line: i + 1,
              suggestion:
                'Eliminar el setter. Para "cambiar" un VO, crear uno nuevo.',
              autoFixable: false,
              category: 'ddd-pattern',
            });
          }
        }
      }
    }

    return findings;
  }

  private checkBusinessLogicLeaks(): Finding[] {
    const findings: Finding[] = [];

    if (!fs.existsSync(this.INFRA_PATH)) return findings;

    const infraFiles = this.getFilesRecursive(this.INFRA_PATH);

    // Patrones que indican lógica de negocio en infra
    const businessPatterns = [
      {
        regex: /if\s*\(\s*price\s*[<>]=?\s*\d/,
        desc: 'Comparación de precios',
      },
      {
        regex: /\.status\s*===?\s*['"][A-Z_]+['']/,
        desc: 'Decisión basada en status de negocio',
      },
      { 
        regex: /\b(margin|discount|markup)\s*[=+\-*/]/, 
        desc: 'Cálculo financiero' 
      },
      {
        regex: /isEligible|isValid|canApprove/,
        desc: 'Regla de elegibilidad',
      },
    ];

    for (const file of infraFiles) {
      if (
        file.includes('.test.') ||
        file.includes('__tests__') ||
        file.includes('.d.ts')
      )
        continue;
      // Solo analizar archivos de adaptadores, no configuración
      if (
        !file.includes('adapter') &&
        !file.includes('repository') &&
        !file.includes('Adapter') &&
        !file.includes('Repository')
      )
        continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        if (line.trim().startsWith('//') || line.trim().startsWith('*'))
          continue;

        for (const pattern of businessPatterns) {
          if (pattern.regex.test(line)) {
            findings.push({
              id: `biz-leak-${file}-${i}`,
              scanner: this.name,
              severity: 'medium',
              title: `Posible lógica de negocio en Infrastructure: ${pattern.desc}`,
              description: `Detectado en adaptador: ${line.trim().substring(0, 80)}`,
              file,
              line: i + 1,
              suggestion:
                'Mover esta lógica al Domain o Application layer',
              autoFixable: false,
              category: 'architecture-violation',
            });
          }
        }
      }
    }

    return findings;
  }

  private checkAnyUsage(): Finding[] {
    const findings: Finding[] = [];
    const domainFiles = this.getFilesRecursive(this.DOMAIN_PATH);

    for (const file of domainFiles) {
      if (file.includes('.test.') || file.includes('.d.ts')) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        if (line.trim().startsWith('//') || line.trim().startsWith('*'))
          continue;

        // Detectar 'as any', ': any', '<any>'
        if (
          /\bas\s+any\b/.test(line) ||
          /:\s*any\b/.test(line) ||
          /<any>/.test(line)
        ) {
          findings.push({
            id: `any-in-domain-${file}-${i}`,
            scanner: this.name,
            severity: 'high',
            title: `Uso de 'any' en Domain layer`,
            description: `El dominio debe ser 100% type-safe: ${line.trim().substring(0, 80)}`,
            file,
            line: i + 1,
            suggestion:
              'Reemplazar any con tipo específico, unknown + type guard, o genérico',
            autoFixable: false,
            category: 'type-safety',
          });
        }
      }
    }

    return findings;
  }

  private checkResultUsage(): Finding[] {
    const findings: Finding[] = [];
    const appFiles = this.getFilesRecursive(this.APP_PATH);

    for (const file of appFiles) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Detectar throw en use cases (deberían usar Result)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        if (line.trim().startsWith('//')) continue;

        if (
          /throw\s+new\s+Error/.test(line) ||
          /throw\s+new\s+\w+Error/.test(line)
        ) {
          findings.push({
            id: `throw-in-app-${file}-${i}`,
            scanner: this.name,
            severity: 'medium',
            title: `Throw exception en Application layer`,
            description: `Los use cases deben retornar Result<T,E>, no lanzar excepciones: ${line.trim().substring(0, 80)}`,
            file,
            line: i + 1,
            suggestion:
              'Reemplazar throw con return Result.fail(...)',
            autoFixable: false,
            category: 'error-handling',
          });
        }
      }
    }

    return findings;
  }

  private checkDomainEvents(): Finding[] {
    const findings: Finding[] = [];
    const eventsPath = path.join(this.DOMAIN_PATH, 'events');

    if (!fs.existsSync(eventsPath)) {
      findings.push({
        id: 'no-domain-events',
        scanner: this.name,
        severity: 'medium',
        title: 'No se encontró directorio de Domain Events',
        description: `Se esperaba: ${eventsPath}`,
        suggestion:
          'Los aggregates deben emitir Domain Events para comunicación entre bounded contexts',
        autoFixable: false,
        category: 'ddd-pattern',
      });
    }

    return findings;
  }

  private checkRepositoryPorts(): Finding[] {
    const findings: Finding[] = [];
    const portsPath = path.join(this.DOMAIN_PATH, 'ports');
    const altPortsPath = path.join(
      this.APP_PATH,
      'ports',
      'repositories',
    );

    const portsPaths = [portsPath, altPortsPath].filter(
      fs.existsSync,
    );

    if (portsPaths.length === 0) {
      findings.push({
        id: 'no-repository-ports',
        scanner: this.name,
        severity: 'high',
        title: 'No se encontraron Repository ports',
        description:
          'Los Repository interfaces deben estar en domain/ports o application/ports',
        suggestion:
          'Crear interfaces de repositorio en el domain layer',
        autoFixable: false,
        category: 'architecture',
      });
    }

    return findings;
  }

  private checkEntityIdentity(): Finding[] {
    const findings: Finding[] = [];
    const entitiesPath = path.join(this.DOMAIN_PATH, 'entities');

    if (!fs.existsSync(entitiesPath)) return findings;

    const files = this.getFilesRecursive(entitiesPath);
    for (const file of files) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Verificar que las entities tienen un campo id
      if (
        content.includes('export class') &&
        !content.includes('id') &&
        !content.includes('_id')
      ) {
        findings.push({
          id: `entity-no-id-${file}`,
          scanner: this.name,
          severity: 'high',
          title: `Entity sin identidad: ${path.basename(file)}`,
          description:
            'Las Entities deben tener un identificador único',
          file,
          suggestion: 'Agregar propiedad id (UniqueId o string)',
          autoFixable: false,
          category: 'ddd-pattern',
        });
      }
    }

    return findings;
  }

  private checkConsoleUsage(): Finding[] {
    const findings: Finding[] = [];
    const domainFiles = this.getFilesRecursive(this.DOMAIN_PATH);

    for (const file of domainFiles) {
      if (file.includes('.test.')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;

        // Skip comments (// and /* */ and JSDoc *)
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('*/')) continue;

        if (line.includes('console.')) {
          findings.push({
            id: `console-domain-${file}-${i}`,
            scanner: this.name,
            severity: 'low',
            title: `console.* en Domain layer`,
            description:
              'El dominio no debe tener side effects como logging directo',
            file,
            line: i + 1,
            suggestion:
              'Usar un Logger port inyectado o eliminar el console.*',
            autoFixable: true,
            category: 'side-effects',
          });
        }
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
