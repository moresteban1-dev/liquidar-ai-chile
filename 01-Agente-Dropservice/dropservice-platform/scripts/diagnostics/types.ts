
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'pass' | 'warn' | 'fail' | 'error';

export interface Finding {
  id: string;
  scanner: string;
  severity: Severity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion: string;
  autoFixable: boolean;
  category: string;
}

export interface ScanResult {
  scanner: string;
  status: ScanStatus;
  score: number;           // 0-100
  duration: number;        // ms
  findings: Finding[];
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface DiagnosticReport {
  timestamp: string;
  platform: string;
  version: string;
  nodeVersion: string;
  overallScore: number;    // 0-100
  overallGrade: string;    // AAA, AA, A, B, C, D, F
  scanResults: ScanResult[];
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  executionTime: number;
  recommendations: string[];
}

export interface Scanner {
  name: string;
  description: string;
  weight: number;          // Peso en el score global (0-1)
  scan(): Promise<ScanResult>;
}
