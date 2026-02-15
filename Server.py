 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/server.py b/server.py
new file mode 100644
index 0000000000000000000000000000000000000000..14ef74f2e210278fac2aa0e0de9d191f4b97efb3
--- /dev/null
+++ b/server.py
@@ -0,0 +1,174 @@
+import json
+import os
+import sqlite3
+from datetime import datetime
+from http.server import BaseHTTPRequestHandler, HTTPServer
+from pathlib import Path
+from urllib.parse import urlparse
+
+ROOT = Path(__file__).resolve().parent
+DB_PATH = ROOT / "infraguard.db"
+SCHEMA_PATH = ROOT / "database_schema.sql"
+
+
+def init_db():
+    conn = sqlite3.connect(DB_PATH)
+    try:
+        schema = SCHEMA_PATH.read_text(encoding="utf-8")
+        conn.executescript(schema)
+        conn.commit()
+    finally:
+        conn.close()
+
+
+def query_all(sql, params=()):
+    conn = sqlite3.connect(DB_PATH)
+    conn.row_factory = sqlite3.Row
+    try:
+        cur = conn.execute(sql, params)
+        rows = [dict(row) for row in cur.fetchall()]
+        return rows
+    finally:
+        conn.close()
+
+
+def execute(sql, params=()):
+    conn = sqlite3.connect(DB_PATH)
+    try:
+        cur = conn.execute(sql, params)
+        conn.commit()
+        return cur.lastrowid
+    finally:
+        conn.close()
+
+
+class Handler(BaseHTTPRequestHandler):
+    def _send_json(self, status, payload):
+        data = json.dumps(payload).encode("utf-8")
+        self.send_response(status)
+        self.send_header("Content-Type", "application/json")
+        self.send_header("Content-Length", str(len(data)))
+        self.end_headers()
+        self.wfile.write(data)
+
+    def _send_file(self, file_path):
+        if not file_path.exists() or not file_path.is_file():
+            self.send_error(404, "Not Found")
+            return
+
+        content_type = "text/plain"
+        if file_path.suffix == ".html":
+            content_type = "text/html"
+        elif file_path.suffix == ".css":
+            content_type = "text/css"
+        elif file_path.suffix == ".js":
+            content_type = "application/javascript"
+
+        data = file_path.read_bytes()
+        self.send_response(200)
+        self.send_header("Content-Type", content_type)
+        self.send_header("Content-Length", str(len(data)))
+        self.end_headers()
+        self.wfile.write(data)
+
+    def _read_json_body(self):
+        content_length = int(self.headers.get("Content-Length", 0))
+        raw = self.rfile.read(content_length).decode("utf-8")
+        return json.loads(raw) if raw else {}
+
+    def do_GET(self):
+        parsed = urlparse(self.path)
+
+        if parsed.path == "/api/health":
+            return self._send_json(200, {"status": "ok"})
+
+        if parsed.path == "/api/infrastructure":
+            rows = query_all("SELECT id, name, type, location FROM Infrastructure ORDER BY id DESC")
+            return self._send_json(200, rows)
+
+        if parsed.path == "/api/sensordata":
+            rows = query_all(
+                """
+                SELECT sd.infra_id, i.name AS infra_name, sd.sensor_value, sd.status, sd.timestamp
+                FROM SensorData sd
+                LEFT JOIN Infrastructure i ON i.id = sd.infra_id
+                ORDER BY sd.timestamp DESC
+                """
+            )
+            return self._send_json(200, rows)
+
+        if parsed.path == "/api/alerts":
+            rows = query_all(
+                """
+                SELECT a.alert_id, a.infra_id, i.name AS infra_name, a.message, a.status
+                FROM Alerts a
+                LEFT JOIN Infrastructure i ON i.id = a.infra_id
+                ORDER BY a.alert_id DESC
+                """
+            )
+            return self._send_json(200, rows)
+
+        static_path = ROOT / ("index.html" if parsed.path == "/" else parsed.path.lstrip("/"))
+        return self._send_file(static_path)
+
+    def do_POST(self):
+        parsed = urlparse(self.path)
+        try:
+            body = self._read_json_body()
+
+            if parsed.path == "/api/infrastructure":
+                name = body.get("name", "").strip()
+                infra_type = body.get("type", "").strip()
+                location = body.get("location", "").strip()
+
+                if not name or not infra_type or not location:
+                    return self._send_json(400, {"error": "name, type and location are required"})
+
+                row_id = execute(
+                    "INSERT INTO Infrastructure (name, type, location) VALUES (?, ?, ?)",
+                    (name, infra_type, location),
+                )
+                return self._send_json(201, {"id": row_id, "name": name, "type": infra_type, "location": location})
+
+            if parsed.path == "/api/sensordata":
+                infra_id = body.get("infra_id")
+                sensor_value = body.get("sensor_value")
+                status = body.get("status", "").strip()
+                timestamp = body.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
+
+                if not infra_id or sensor_value is None or not status:
+                    return self._send_json(400, {"error": "infra_id, sensor_value and status are required"})
+
+                execute(
+                    "INSERT INTO SensorData (infra_id, sensor_value, status, timestamp) VALUES (?, ?, ?, ?)",
+                    (infra_id, sensor_value, status, timestamp),
+                )
+                return self._send_json(201, {"infra_id": infra_id, "sensor_value": sensor_value, "status": status, "timestamp": timestamp})
+
+            if parsed.path == "/api/alerts":
+                infra_id = body.get("infra_id")
+                message = body.get("message", "").strip()
+                status = body.get("status", "").strip()
+
+                if not infra_id or not message or not status:
+                    return self._send_json(400, {"error": "infra_id, message and status are required"})
+
+                row_id = execute(
+                    "INSERT INTO Alerts (infra_id, message, status) VALUES (?, ?, ?)",
+                    (infra_id, message, status),
+                )
+                return self._send_json(201, {"alert_id": row_id, "infra_id": infra_id, "message": message, "status": status})
+
+            self._send_json(404, {"error": "Not found"})
+        except sqlite3.Error as error:
+            self._send_json(400, {"error": str(error)})
+        except json.JSONDecodeError:
+            self._send_json(400, {"error": "Invalid JSON"})
+
+
+if __name__ == "__main__":
+    init_db()
+    port = int(os.getenv("PORT", "3000"))
+    server = HTTPServer(("0.0.0.0", port), Handler)
+    print(f"InfraGuard app running at http://localhost:{port}")
+    server.serve_forever()
 
EOF
)
