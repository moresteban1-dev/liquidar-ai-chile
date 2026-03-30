---
name: senior-fullstack
description: Comprehensive fullstack development skill for building complete web applications with React, Next.js, Node.js, GraphQL, and PostgreSQL. Includes project scaffolding, code quality analysis, architecture patterns, and complete tech stack guidance. Use when building new projects, analyzing code quality, implementing design patterns, or setting up development workflows.
---

# Senior Fullstack

Complete toolkit for senior fullstack development with modern tools and best practices.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Fullstack Scaffolder
python scripts/fullstack_scaffolder.py [options]

# Script 2: Project Scaffolder
python scripts/project_scaffolder.py [options]

# Script 3: Code Quality Analyzer
python scripts/code_quality_analyzer.py [options]
```

---

## Core Capabilities

### 1. Fullstack Scaffolder

Automated tool for creating complete fullstack project structures.

**Features:**

- Automated scaffolding for React/Next.js + Node.js projects
- Best practices built-in (linting, testing, CI/CD)
- Configurable templates (REST, GraphQL, monorepo)
- Quality checks and pre-configured tooling

**Usage:**

```bash
python scripts/fullstack_scaffolder.py <project-path> [options]

# Options:
#   --template [nextjs|react-vite|monorepo]  Project template
#   --backend [express|fastify|nestjs]       Backend framework
#   --database [postgres|mongodb|sqlite]     Database type
#   --auth [jwt|oauth|clerk]                 Authentication method
#   --docker                                 Include Docker setup
#   --ci [github|gitlab|circleci]            CI/CD configuration
```

---

### 2. Project Scaffolder

Comprehensive analysis and project structure optimization tool.

**Features:**

- Deep project structure analysis
- Performance metrics and bundle size analysis
- Architecture recommendations
- Automated fixes for common issues

**Usage:**

```bash
python scripts/project_scaffolder.py <target-path> [--verbose]

# Options:
#   --verbose         Detailed output
#   --fix             Auto-fix detected issues
#   --report          Generate HTML report
#   --benchmark       Include performance benchmarks
```

---

### 3. Code Quality Analyzer

Advanced tooling for code quality assessment and improvement.

**Features:**

- Expert-level static analysis
- Custom ESLint/Prettier configurations
- Integration with SonarQube, CodeClimate
- Production-grade quality reports

**Usage:**

```bash
python scripts/code_quality_analyzer.py [arguments] [options]

# Options:
#   --analyze         Run full analysis
#   --security        Security vulnerability scan
#   --performance     Performance analysis
#   --maintainability Code maintainability metrics
#   --output [json|html|markdown]  Report format
```

---

## Reference Documentation

### Tech Stack Guide

Comprehensive guide available in `references/tech_stack_guide.md`:

- Detailed patterns and practices for each technology
- Code examples with TypeScript
- Best practices and anti-patterns to avoid
- Real-world scenarios and solutions

### Architecture Patterns

Complete workflow documentation in `references/architecture_patterns.md`:

- Step-by-step architectural processes
- Optimization strategies
- Tool integrations
- Performance tuning
- Troubleshooting guide

### Development Workflows

Technical reference guide in `references/development_workflows.md`:

- Technology stack details
- Configuration examples
- Integration patterns
- Security considerations
- Scalability guidelines

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Languages** | TypeScript, JavaScript, Python, Go, Swift, Kotlin |
| **Frontend** | React, Next.js, React Native, Flutter |
| **Backend** | Node.js, Express, GraphQL, REST APIs |
| **Database** | PostgreSQL, Prisma, NeonDB, Supabase |
| **DevOps** | Docker, Kubernetes, Terraform, GitHub Actions, CircleCI |
| **Cloud** | AWS, GCP, Azure |

---

## Development Workflow

### 1. Setup and Configuration

```bash
# Install dependencies
npm install
# or
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

### 2. Run Quality Checks

```bash
# Use the analyzer script
python scripts/project_scaffolder.py .

# Review recommendations
# Apply fixes
```

### 3. Implement Best Practices

Follow the patterns and practices documented in:

- `references/tech_stack_guide.md`
- `references/architecture_patterns.md`
- `references/development_workflows.md`

---

## Best Practices Summary

### Code Quality

| Practice | Description |
|----------|-------------|
| Follow established patterns | Use consistent architectural patterns |
| Write comprehensive tests | Unit, integration, and E2E tests |
| Document decisions | ADRs for important architectural decisions |
| Review regularly | Code reviews and pair programming |

### Performance

| Practice | Description |
|----------|-------------|
| Measure before optimizing | Profile before making changes |
| Use appropriate caching | Redis, CDN, browser caching |
| Optimize critical paths | Focus on user-facing performance |
| Monitor in production | APM tools, error tracking |

### Security

| Practice | Description |
|----------|-------------|
| Validate all inputs | Server-side validation always |
| Use parameterized queries | Prevent SQL injection |
| Implement proper authentication | JWT, OAuth 2.0, session management |
| Keep dependencies updated | Regular security audits |

### Maintainability

| Practice | Description |
|----------|-------------|
| Write clear code | Self-documenting code |
| Use consistent naming | Follow naming conventions |
| Add helpful comments | Document "why", not "what" |
| Keep it simple | KISS principle |

---

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code

# Analysis
python scripts/project_scaffolder.py .
python scripts/code_quality_analyzer.py --analyze

# Deployment
docker build -t app:latest .
docker-compose up -d
kubectl apply -f k8s/
```

---

## Troubleshooting

### Common Issues

Check the comprehensive troubleshooting section in `references/development_workflows.md`.

### Getting Help

1. Review reference documentation
2. Check script output messages
3. Consult tech stack documentation
4. Review error logs

---

## Resources

| Resource | Path |
|----------|------|
| Pattern Reference | `references/tech_stack_guide.md` |
| Workflow Guide | `references/architecture_patterns.md` |
| Technical Guide | `references/development_workflows.md` |
| Tool Scripts | `scripts/` directory |
