import argparse
import subprocess
import time
import socket
import sys
import os
import signal

def check_port(host, port):
    """Checks if a port is open on the given host."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex((host, port)) == 0

def kill_process_tree(pid):
    """Kills a process and its children using taskkill on Windows."""
    try:
        if os.name == 'nt':
            subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="Manages server lifecycle (supports multiple servers)")
    parser.add_argument("--server", action="append", help="Server start command (can be used multiple times)", required=True)
    parser.add_argument("--port", action="append", type=int, help="Port to wait for (must match number of servers)", required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER, help="Test command to run after servers are ready")

    args = parser.parse_args()

    if len(args.server) != len(args.port):
        print("Error: The number of --server arguments must match the number of --port arguments.")
        sys.exit(1)

    procs = []
    
    try:
        # Start servers
        for i, cmd in enumerate(args.server):
            port = args.port[i]
            print(f"Starting server on port {port}: {cmd}")
            # Use shell=True to handle commands like 'npm run dev'
            proc = subprocess.Popen(cmd, shell=True, cwd=os.getcwd())
            procs.append(proc)

        # Wait for ports to be ready
        print("Waiting for servers to become ready...")
        start_time = time.time()
        timeout = 60 # 60 seconds timeout
        
        all_ready = False
        while time.time() - start_time < timeout:
            ready_count = 0
            for port in args.port:
                if check_port("localhost", port):
                    ready_count += 1
            
            if ready_count == len(args.port):
                all_ready = True
                break
            
            time.sleep(1)
            
            # Check if any server process died early
            for i, proc in enumerate(procs):
                if proc.poll() is not None:
                     print(f"Error: Server process '{args.server[i]}' exited early with code {proc.returncode}")
                     sys.exit(1)

        if not all_ready:
            print(f"Timeout: Servers did not start within {timeout} seconds.")
            sys.exit(1)

        print("Servers are ready. Running test command...")
        
        # Parse the command to run
        cmd_args = args.command
        # Remove the leading '--' if present (argparse puts it in the list if used as separator)
        if cmd_args and cmd_args[0] == '--':
            cmd_args = cmd_args[1:]
            
        if not cmd_args:
            print("Error: No test command provided.")
            sys.exit(1)

        # Run the test command
        print(f"Executing: {' '.join(cmd_args)}")
        result = subprocess.run(cmd_args, check=False)
        sys.exit(result.returncode)

    except KeyboardInterrupt:
        print("\nInterrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
    finally:
        print("Stopping servers...")
        for proc in procs:
            kill_process_tree(proc.pid)

if __name__ == "__main__":
    main()
