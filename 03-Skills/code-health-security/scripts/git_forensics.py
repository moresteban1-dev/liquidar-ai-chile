import subprocess
import sys

def find_deleted_content(keyword):
    """Busca contenido borrado en el historial de git (pickaxe search)."""
    print(f"--- Buscando rastros forenses de: {keyword} ---")
    # Busca commits donde se eliminó o cambió el texto específico
    cmd = ["git", "log", "-S", keyword, "--source", "--all"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

def find_recent_deletions(days=30):
    """Lista archivos eliminados recientemente."""
    print(f"--- Archivos eliminados en los últimos {days} días ---")
    cmd = ["git", "log", "--diff-filter=D", f"--since={days}.days", "--summary"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python git_forensics.py <action> [keyword]")
        sys.exit(1)

    action = sys.argv[1]
    
    if action == "search":
        if len(sys.argv) < 3:
            print("Error: Se requiere keyword para search")
        else:
            print(find_deleted_content(sys.argv[2]))
    elif action == "deleted_files":
        print(find_recent_deletions())
    else:
        print(f"Acción desconocida: {action}")
