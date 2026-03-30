#!/usr/bin/env python3
"""
Fullstack Scaffolder - Automated fullstack project scaffolding tool.
Creates complete fullstack project structures with best practices.
"""

import argparse
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any


def create_directory_structure(project_root: Path):
    """Create the base directory structure."""
    print("\n📁 Creating directory structure...")
    dirs = [
        "frontend/src/components", "frontend/src/hooks", "frontend/src/lib",
        "frontend/src/styles", "frontend/src/types", "frontend/public",
        "backend/src/routes", "backend/src/controllers", "backend/src/services",
        "backend/src/models", "backend/src/middleware", "backend/src/utils",
        "shared/types", "shared/utils", "database/migrations", "database/seeds",
        "tests/unit", "tests/integration", "tests/e2e", "docs", "scripts",
    ]
    for dir_path in dirs:
        (project_root / dir_path).mkdir(parents=True, exist_ok=True)


def create_frontend_package(project_root: Path, name: str) -> Dict[str, Any]:
    """Generate frontend package.json."""
    return {
        "name": f"{name}-frontend",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "dev": "next dev", "build": "next build",
            "start": "next start", "lint": "next lint", "test": "jest"
        },
        "dependencies": {
            "next": "^14.0.0", "react": "^18.2.0", "react-dom": "^18.2.0"
        },
        "devDependencies": {
            "@types/node": "^20.0.0", "@types/react": "^18.2.0",
            "typescript": "^5.0.0", "eslint": "^8.0.0"
        }
    }


def create_backend_package(project_root: Path, name: str) -> Dict[str, Any]:
    """Generate backend package.json."""
    return {
        "name": f"{name}-backend",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "dev": "tsx watch src/server.ts", "build": "tsc",
            "start": "node dist/server.js", "lint": "eslint src/", "test": "jest"
        },
        "dependencies": {
            "express": "^4.18.0", "cors": "^2.8.5",
            "dotenv": "^16.0.0", "helmet": "^7.0.0"
        },
        "devDependencies": {
            "@types/node": "^20.0.0", "@types/express": "^4.17.0",
            "typescript": "^5.0.0", "tsx": "^4.0.0"
        }
    }


def create_server_file(project_root: Path):
    """Create main backend server file."""
    server = '''import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
'''
    (project_root / "backend" / "src" / "server.ts").write_text(server, encoding="utf-8")


def create_env_files(project_root: Path):
    """Create environment files."""
    frontend_env = "NEXT_PUBLIC_API_URL=http://localhost:4000\n"
    backend_env = """NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
JWT_SECRET=change-in-production
"""
    (project_root / "frontend" / ".env.example").write_text(frontend_env, encoding="utf-8")
    (project_root / "backend" / ".env.example").write_text(backend_env, encoding="utf-8")


def scaffold(project_path: Path, template: str = "nextjs", backend: str = "express"):
    """Execute the scaffolding process."""
    print(f"\n🚀 Scaffolding fullstack project: {project_path}")
    print(f"   Template: {template} | Backend: {backend}")

    project_path.mkdir(parents=True, exist_ok=True)
    create_directory_structure(project_path)

    # Write package.json files
    name = project_path.name
    frontend_pkg = create_frontend_package(project_path, name)
    backend_pkg = create_backend_package(project_path, name)
    
    (project_path / "frontend" / "package.json").write_text(
        json.dumps(frontend_pkg, indent=2), encoding="utf-8")
    (project_path / "backend" / "package.json").write_text(
        json.dumps(backend_pkg, indent=2), encoding="utf-8")

    create_server_file(project_path)
    create_env_files(project_path)

    print("\n✅ Project scaffolded successfully!")
    print(f"\nNext steps:\n  cd {project_path}\n  cd frontend && npm install\n  cd ../backend && npm install")


def main():
    parser = argparse.ArgumentParser(description="Fullstack Scaffolder")
    parser.add_argument("project_path", type=Path, help="Path for the new project")
    parser.add_argument("--template", default="nextjs", choices=["nextjs", "react-vite", "monorepo"])
    parser.add_argument("--backend", default="express", choices=["express", "fastify", "nestjs"])
    parser.add_argument("--docker", action="store_true", help="Include Docker config")
    args = parser.parse_args()
    
    scaffold(args.project_path.resolve(), args.template, args.backend)


if __name__ == "__main__":
    main()
