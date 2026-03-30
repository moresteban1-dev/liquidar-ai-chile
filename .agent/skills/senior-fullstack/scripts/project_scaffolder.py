#!/usr/bin/env python3
"""
Project Scaffolder - Comprehensive analysis and optimization tool.
Analyzes project structure, package.json dependencies, and configuration files
to provide recommendations and improvements.
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

class ProjectAnalyzer:
    def __init__(self, target_path: Path, verbose: bool = False):
        self.target_path = target_path
        self.verbose = verbose
        self.issues: List[str] = []
        self.recommendations: List[str] = []

    def analyze(self):
        """Run all analysis steps."""
        print(f"\n🔍 Analyzing project at: {self.target_path}")
        
        if not self.target_path.exists():
            print(f"❌ Path {self.target_path} does not exist.")
            return

        self._check_structure()
        self._check_package_json()
        self._check_configs()
        
        self._print_report()

    def _check_structure(self):
        """Check for standard project structure."""
        required_files = ["package.json", "README.md", ".gitignore"]
        missing_files = [f for f in required_files if not (self.target_path / f).exists()]
        
        if missing_files:
            self.issues.append(f"Missing critical files: {', '.join(missing_files)}")
        
        # Check for src directory usage
        if not (self.target_path / "src").exists() and (self.target_path / "index.js").exists():
            self.recommendations.append("Consider moving source code to a 'src' directory.")

    def _check_package_json(self):
        """Analyze package.json for dependencies and scripts."""
        pkg_path = self.target_path / "package.json"
        if not pkg_path.exists():
            return

        try:
            with open(pkg_path, 'r', encoding='utf-8') as f:
                pkg_data = json.load(f)
            
            scripts = pkg_data.get("scripts", {})
            dependencies = pkg_data.get("dependencies", {})
            dev_dependencies = pkg_data.get("devDependencies", {})

            # Check for essential scripts
            if "test" not in scripts:
                self.issues.append("No 'test' script defined in package.json")
            if "lint" not in scripts:
                self.recommendations.append("Consider adding a 'lint' script.")

            # Check for outdated or discouraged packages
            if "moment" in dependencies:
                self.recommendations.append("Consider replacing 'moment' with 'date-fns' or 'dayjs' for smaller bundle size.")
            
            if self.verbose:
                print(f"   ℹ️ Found {len(dependencies)} dependencies and {len(dev_dependencies)} devDependencies.")

        except json.JSONDecodeError:
            self.issues.append("Invalid package.json file.")

    def _check_configs(self):
        """Check for configuration files."""
        configs = {
            "TypeScript": ["tsconfig.json"],
            "ESLint": [".eslintrc", ".eslintrc.json", ".eslintrc.js"],
            "Prettier": [".prettierrc", ".prettierrc.json"],
            "Git": [".gitignore"],
            "EditorConfig": [".editorconfig"]
        }

        for tool, files in configs.items():
            found = any((self.target_path / f).exists() for f in files)
            if not found:
                self.recommendations.append(f"Add {tool} configuration for better code quality/consistency.")

    def _print_report(self):
        """Print the analysis report."""
        print("\n📊 Analysis Report")
        print("=" * 50)
        
        if self.issues:
            print("\n❌ Issues Found:")
            for issue in self.issues:
                print(f"  - {issue}")
        else:
            print("\n✅ No critical issues found.")

        if self.recommendations:
            print("\n💡 Recommendations:")
            for rec in self.recommendations:
                print(f"  - {rec}")
        else:
            print("\n✨ No recommendations at this time.")

        print("\n" + "=" * 50)


def main():
    parser = argparse.ArgumentParser(description="Project Scaffolder & Analyzer")
    parser.add_argument("target_path", type=Path, help="Target project path")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("--fix", action="store_true", help="Attempt to auto-fix issues (not implemented in this version)")
    
    args = parser.parse_args()
    
    analyzer = ProjectAnalyzer(args.target_path.resolve(), args.verbose)
    analyzer.analyze()

    if args.fix:
        print("\n⚠️ Auto-fix feature is coming soon.")

if __name__ == "__main__":
    main()
