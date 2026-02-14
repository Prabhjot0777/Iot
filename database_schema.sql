 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/database_schema.sql b/database_schema.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a4a2da1d645796de16397875b3c3a338187f058a
--- /dev/null
+++ b/database_schema.sql
@@ -0,0 +1,24 @@
+-- InfraGuard hackathon database schema
+
+CREATE TABLE IF NOT EXISTS Infrastructure (
+    id INTEGER PRIMARY KEY,
+    name VARCHAR(150) NOT NULL,
+    type VARCHAR(20) NOT NULL CHECK (type IN ('Bridge', 'Streetlight')),
+    location VARCHAR(255) NOT NULL
+);
+
+CREATE TABLE IF NOT EXISTS SensorData (
+    infra_id INTEGER NOT NULL,
+    sensor_value DECIMAL(10,2) NOT NULL,
+    status VARCHAR(50) NOT NULL,
+    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    FOREIGN KEY (infra_id) REFERENCES Infrastructure(id)
+);
+
+CREATE TABLE IF NOT EXISTS Alerts (
+    alert_id INTEGER PRIMARY KEY,
+    infra_id INTEGER NOT NULL,
+    message TEXT NOT NULL,
+    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Resolved')),
+    FOREIGN KEY (infra_id) REFERENCES Infrastructure(id)
+);
 
EOF
)
