 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index d160fa147b61b0b96be814bd41cee00867612599..db48e674fb84ccf506629130289fb8c8fbcd4a95 100644
--- a/README.md
+++ b/README.md
@@ -1 +1,44 @@
-# Ai-for-learning-and-academic-project
\ No newline at end of file
+# InfraGuard Full-Stack Starter
+
+This project includes a simple **frontend + backend + SQLite database** setup so you can build hackathon features quickly.
+
+## Database Tables
+Schema file: `database_schema.sql`
+
+1. `Infrastructure`
+   - `id`
+   - `name`
+   - `type` (`Bridge` / `Streetlight`)
+   - `location`
+2. `SensorData`
+   - `infra_id`
+   - `sensor_value`
+   - `status`
+   - `timestamp`
+3. `Alerts`
+   - `alert_id`
+   - `infra_id`
+   - `message`
+   - `status` (`Pending` / `Resolved`)
+
+## Run the app (no external dependencies)
+```bash
+python3 server.py
+```
+
+Open: `http://localhost:3000`
+
+## API Endpoints
+- `GET /api/health`
+- `GET /api/infrastructure`
+- `POST /api/infrastructure`
+- `GET /api/sensordata`
+- `POST /api/sensordata`
+- `GET /api/alerts`
+- `POST /api/alerts`
+
+## Project framework
+- `index.html` has three modules: Infrastructure, SensorData, Alerts.
+- `style.css` provides a reusable dashboard-style UI framework.
+- `script.js` connects forms to backend APIs and refreshes tables automatically.
+- `server.py` provides backend APIs and initializes SQLite from `database_schema.sql`.
 
EOF
)
