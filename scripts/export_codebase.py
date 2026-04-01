
import os

def export_codebase(root_dir, output_file):
    """
    Exports the codebase to a single markdown file.
    """
    
    # Extensions to include
    EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.sql'}
    
    # Directories to exclude
    EXCLUDE_DIRS = {'node_modules', '.next', '.git', '.vscode', 'dist', 'build', 'coverage', '.gemini'}
    
    # Files to exclude
    EXCLUDE_FILES = {'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'}

    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(f"# Codebase Export: {os.path.basename(root_dir)}\n\n")
        
        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                    
                ext = os.path.splitext(file)[1]
                if ext not in EXTENSIONS:
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                outfile.write(f"## File: {rel_path}\n\n")
                outfile.write("```" + ext[1:] + "\n")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Error reading file: {e}")
                
                outfile.write("\n```\n\n")
    
    print(f"Codebase exported to {output_file}")

if __name__ == "__main__":
    project_root = r"c:/Users/Esteban/Desktop/Skill IA/01-Agente-Dropservice/dropservice-platform"
    output_path = r"C:/Users/Esteban/.gemini/antigravity/brain/99964509-1036-4d5a-ab65-baeaf1d4857c/codebase_export.md"
    export_codebase(project_root, output_path)
