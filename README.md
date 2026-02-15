 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index d160fa147b61b0b96be814bd41cee00867612599..e8fb1814170fb6284d6aec7f80d622f65db018bd 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,30 @@
-# Ai-for-learning-and-academic-project
\ No newline at end of file
+# Ai-for-learning-and-academic-project
+
+## InfraGuard Database Setup
+
+A hackathon-level relational schema for **InfraGuard** is included in `database_schema.sql`.
+
+### Tables
+- `Infrastructure`
+  - `id`
+  - `name`
+  - `type` (`Bridge` / `Streetlight`)
+  - `location`
+- `SensorData`
+  - `infra_id`
+  - `sensor_value`
+  - `status`
+  - `timestamp`
+- `Alerts`
+  - `alert_id`
+  - `infra_id`
+  - `message`
+  - `status` (`Pending` / `Resolved`)
+
+### Run locally (SQLite)
+```bash
+sqlite3 infraguard.db < database_schema.sql
+```
+
+### Website preview
+The final slide of the planner UI now includes an **InfraGuard Database Tables** section that visually lists all three tables and their required columns.
 
EOF
)
