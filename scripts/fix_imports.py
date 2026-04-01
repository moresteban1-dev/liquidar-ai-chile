import os
import re

# Precise mapping of old paths (relative or aliased) to new NASA-Grade aliases
mappings = [
    (r'(@/|[\./]+)core/use-cases/', '@core/application/handlers/'),
    (r'(@/|[\./]+)core/ports/driven/', '@core/application/ports/repositories/'),
    (r'(@/|[\./]+)core/entities/', '@core/domain/entities/'),
    (r'(@/|[\./]+)core/errors/', '@core/domain/errors/'),
    (r'(@/|[\./]+)core/types/', '@core/domain/types/'),
    (r'(@/|[\./]+)core/domain/aggregates/', '@core/domain/aggregates/'),
    (r'(@/|[\./]+)core/shared/', '@core/shared/'),
    (r'(@/|[\./]+)infrastructure/repositories/', '@infrastructure/persistence/supabase/repositories/'),
    (r'(@/|[\./]+)infrastructure/observability/', '@infrastructure/telemetry/'),
    (r'(@/|[\./]+)infrastructure/di/', '@infrastructure/di/'),
    (r'(@/|[\./]+)di/', '@infrastructure/di/'),
    (r'(@/|[\./]+)core/', '@core/'),
    (r'(@/|[\./]+)infrastructure/', '@infrastructure/'),
    # Extra cleanups for common mistakes
    (r'from "@core/domain/entities/Quotation"', 'from "@core/domain/entities/Quotation"'), # Identity
    (r'@/infrastructure/shared/', '@infrastructure/shared/'),
]

def fix_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for pattern, replacement in mappings:
            # We match the pattern inside quotes
            # Using raw strings and ensuring we replace the leading part correctly
            new_content = re.sub(r'["\']' + pattern, f'"{replacement}', new_content)
            new_content = re.sub(r"'" + pattern, f"'{replacement}", new_content)
        
        # Cleanup any double quotes or weird artifacts like "../@core"
        new_content = re.sub(r'["\'][\./]+@core/', '"@core/', new_content)
        new_content = re.sub(r'["\'][\./]+@infrastructure/', '"@infrastructure/', new_content)

        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {path}")
    except Exception as e:
        print(f"Error fixing {path}: {e}")

if __name__ == "__main__":
    src_path = 'src'
    for root, dirs, files in os.walk(src_path):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                fix_file(os.path.join(root, file))
