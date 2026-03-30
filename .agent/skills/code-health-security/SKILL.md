---
name: code-health-security
description: Forensic code analysis, bug investigation, performance auditing, and continuous security protection. Integrates the Deep Clean Audit workflow with Deep Code Guardian principles.
---

# Code Health & Security

This skill transforms the agent into a forensic engineer and security auditor focused on ensuring total system integrity and quality.

## 1. Forensic Analysis & Recovery (Audit Phase)

Use version history and deep logs to identify root causes of failures or recover "lost" knowledge.

* **Identification**: Track when errors were introduced or functional code was removed via `git log/blame`.
* **Knowledge Retrieval**: Scan history for deleted fragments that solve current architectural challenges.

## 2. Security & Deep Audit (SAST/DAST)

Proactive protection against vulnerabilities and technical debt.

* **Static Analysis**: Detect hardcoded secrets, OWASP vulnerabilities, and complex logical flaws.
* **Dependency Auditing**: Verify the SBOM (Software Bill of Materials) for vulnerable or legacy libraries.
* **Flow Tracing**: Audit data paths from user input to DB to prevent injection and validation bypass.

## 3. Technical Debt Cleanup

Holistic refactoring for better maintainability (SOLID/Clean Architecture).

* **Clean Architecture**: Decouple business logic from external frameworks.
* **DRY & KISS**: Eliminate duplicate code and simplify over-engineered patterns.
* **Standardization**: Ensure the project adheres to strict formatting (ESLint/Prettier/PEP8).

## 4. Verification & Deployment

Automated assurance before production.

* **Unit & Integration Tests**: Generate coverage for critical paths discovered during auditing.
* **Deployment Simulation**: Audit Docker/CI-CD configs to ensure production replicas are stable.

## Constraints & Ethical Rules

* **No history deletion**: Never overwrite Git history; use reverts or new commits.
* **Secret Protection**: NEVER expose API keys or secrets in logs/reports.
* **Priority**: Critical security vulnerabilities ALWAYS take precedence over aesthetic refactorings.
