
import socket

hostname = "db.xzudckofcdxqxjforlxw.supabase.co"
try:
    print(f"Resolving {hostname}...")
    info = socket.getaddrinfo(hostname, 5432)
    print("Resolved to:", info)
except Exception as e:
    print("Resolution Failed:", e)
