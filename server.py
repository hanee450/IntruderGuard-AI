import http.server
import socketserver
import socket
import os
import sys

# Force UTF-8 stdout encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 5000

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

local_ip = get_local_ip()

print("=" * 65)
print("[LIVE SERVER] INTRUDER GUARD MOBILE LIVE SERVER IS RUNNING!")
print("=" * 65)
print(f"--> Local PC Link  : http://localhost:{PORT}")
print(f"--> Mobile Wi-Fi   : http://{local_ip}:{PORT}")
print("-" * 65)
print("INSTRUCTIONS FOR SMARTPHONE (Android / iPhone):")
print(f" 1. Connect phone to the SAME Wi-Fi as this PC.")
print(f" 2. Open browser on phone and go to: http://{local_ip}:{PORT}")
print(" 3. Tap 'Add to Home Screen' in browser menu!")
print(" 4. Allow Camera permission -> Enter wrong PIN to snap photo!")
print("=" * 65)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
