import subprocess
import sys
import os

def run_security_scan(target_dir):
    """
    Ejecuta un escaneo básico de patrones de seguridad y calidad.
    Nota: El agente debe tener instaladas herramientas como pylint, bandit o npm audit.
    """
    results = {}
    
    # Ejemplo para Python: Bandit para seguridad
    print("--- Ejecutando Análisis de Seguridad (SAST) ---")
    # Nota: Si bandit no está en path, esto fallará. En entorno JS/TS se puede adaptar.
    try:
        cmd = ["bandit", "-r", target_dir, "-f", "json"] 
        res = subprocess.run(cmd, capture_output=True, text=True)
        results['security'] = res.stdout
    except FileNotFoundError:
        results['security'] = "Herramienta 'bandit' no encontrada. (Omitido)"

    # Búsqueda de Deuda Técnica (Universal)
    print("--- Buscando Deuda Técnica (TODOs/FIXMEs) ---")
    # grep recursivo buscando marcas de deuda técnica
    try:
        cmd = ["grep", "-r", "-E", "TODO|FIXME|HACK", target_dir]
        res = subprocess.run(cmd, capture_output=True, text=True)
        results['technical_debt'] = res.stdout
    except FileNotFoundError:
        results['technical_debt'] = "Comando 'grep' no disponible."
    
    return results

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    print(run_security_scan(target))
