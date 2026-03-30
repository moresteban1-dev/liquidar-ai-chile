#!/usr/bin/env python3
"""
Code Quality Analyzer - Advanced tooling for code quality assessment.
Wraps standard linting, formatting, and security tools.
"""

import sys
import subprocess
import argparse
from pathlib import Path
from typing import List

class QualityAnalyzer:
    def __init__(self, target_path: Path):
        self.target_path = target_path

    def run_command(self, command: List[str], description: str):
        """Run a shell command and print status."""
        print(f"\n🚀 Running {description}...")
        try:
            # Check if npm is available for these tools
            if command[0] == "npm" and not self._is_npm_project():
                 print(f"   ⚠️ Skipping {description}: Not an npm project or missing package.json")
                 return

            result = subprocess.run(
                command, 
                cwd=self.target_path, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True
            )
            
            if result.returncode == 0:
                print(f"   ✅ {description} passed.")
            else:
                print(f"   ⚠️ {description} found issues:")
                print(result.stdout[:500] + ("..." if len(result.stdout) > 500 else ""))
                if result.stderr:
                    print(f"   Error details: {result.stderr[:200]}...")

        except FileNotFoundError:
             print(f"   ❌ Tool not found: {command[0]}")
        except Exception as e:
            print(f"   ❌ Execution failed: {e}")

    def _is_npm_project(self) -> bool:
        return (self.target_path / "package.json").exists()

    def analyze_security(self):
        """Run security audit."""
        self.run_command(["npm", "audit"], "Security Audit (npm audit)")

    def analyze_linting(self):
        """Run linting."""
        # Try generic lint script first
        self.run_command(["npm", "run", "lint"], "Linter")

    def analyze_tests(self):
        """Run tests."""
        self.run_command(["npm", "test", "--", "--passWithNoTests"], "Tests")

    def check_todo_markers(self):
        """Scan for TODO/FIXME markers."""
        print(f"\n📝 Scanning for TODO/FIXME markers...")
        count = 0
        try:
            for path in self.target_path.rglob("*"):
                if path.is_file() and not any(p in str(path) for p in ["node_modules", ".git", "dist", "build"]):
                    try:
                        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                            for i, line in enumerate(f, 1):
                                if "TODO" in line or "FIXME" in line:
                                    print(f"   - {path.name}:{i}: {line.strip()[:60]}")
                                    count += 1
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error scanning files: {e}")
            
        if count == 0:
            print("   ✅ No markers found.")

    def run_all(self):
        self.analyze_security()
        self.analyze_linting()
        self.analyze_tests()
        self.check_todo_markers()


def main():
    parser = argparse.ArgumentParser(description="Code Quality Analyzer")
    parser.add_argument("target_path", nargs="?", default=".", help="Target path (default: current dir)")
    parser.add_argument("--analyze", action="store_true", help="Run full analysis")
    parser.add_argument("--security", action="store_true", help="Run security scan only")
    
    args = parser.parse_args()
    target = Path(args.target_path).resolve()
    
    analyzer = QualityAnalyzer(target)

    if args.security:
        analyzer.analyze_security()
    else:
        # Default behavior or --analyze
        analyzer.run_all()

if __name__ == "__main__":
    main()
