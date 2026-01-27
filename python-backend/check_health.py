import requests
try:
    r = requests.get("http://localhost:8000")
    print(r.json())
except Exception as e:
    print("Error:", e)
