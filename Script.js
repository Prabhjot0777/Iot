 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index 0a43f3fd51efd92de9bbedbe4202c9b903e9675a..2a7040a6bfc247fa1b60497a8ed2999441893e3f 100644
--- a/script.js
+++ b/script.js
@@ -1,443 +1,137 @@
-// ---------- LOGIN ----------
-let isLoggedIn = false;
-
-// Auto login if user already exists
-if (localStorage.getItem("user")) {
-  isLoggedIn = true;
-}
-
-// ---------- SLIDER ----------
-let slide = 0;
-const slides = document.querySelectorAll(".slide");
-const bar = document.getElementById("bar");
-
-function updateUI() {
-  slides.forEach((s, i) => {
-    s.classList.toggle("active", i === slide);
-  });
-
-  bar.style.width = (slide / (slides.length - 1)) * 100 + "%";
-}
-
-function next() {
-  if (!isLoggedIn && slide === 0) {
-    alert("Please login first");
-    return;
-  }
-
-  if (slide < slides.length - 1) {
-    slide++;
-    updateUI();
-  }
-}
-
-function back() {
-  if (slide > 0) {
-    slide--;
-    updateUI();
-  }
-}
-
-// ---------- LOGIN FUNCTION ----------
-function loginUser() {
-  const username = document.getElementById("username").value.trim();
-  const password = document.getElementById("password").value.trim();
-
-  if (!username || !password) {
-    alert("Please enter username and password");
-    return;
-  }
-
-  // Demo login
-  localStorage.setItem("user", username);
-  isLoggedIn = true;
-
-  next();
-}
-
-/* ---------- DATA ---------- */
-let goals = [];
-let allTasks = [];
-
-/* ---------- GOALS ---------- */
-
-function addGoal() {
-  const input = document.getElementById("goalInput");
-  const color = document.getElementById("goalColor").value;
-
-  if (!input.value.trim()) return;
-
-  goals.push({
-    name: input.value.trim(),
-    color
+const infraBody = document.getElementById("infraBody");
+const sensorBody = document.getElementById("sensorBody");
+const alertBody = document.getElementById("alertBody");
+const flash = document.getElementById("flash");
+
+function showMessage(message, isError = false) {
+  flash.textContent = message;
+  flash.className = isError ? "show error" : "show";
+  setTimeout(() => {
+    flash.className = "";
+  }, 2000);
+}
+
+async function api(url, options = {}) {
+  const res = await fetch(url, {
+    headers: { "Content-Type": "application/json" },
+    ...options
   });
-
-  input.value = "";
-  renderGoals();
-}
-
-function deleteGoal(i) {
-  goals.splice(i, 1);
-  renderGoals();
-}
-
-function renderGoals() {
-  document.getElementById("goals").innerHTML =
-    goals.map((g, i) => `
-      <div class="goal-box">
-        <strong>${g.name}</strong>
-        <div class="color-bar" style="background:${g.color}"></div>
-        <span class="delete" onclick="deleteGoal(${i})">✕</span>
-      </div>
-    `).join("");
-
-  document.getElementById("tasksArea").innerHTML =
-    goals.map((g, i) => `
-      <div class="goal-box">
-        <strong>${g.name}</strong>
-        <div class="color-bar" style="background:${g.color}"></div>
-        <textarea id="tasks${i}" placeholder="Write tasks..."></textarea>
-      </div>
-    `).join("");
-}
-
-/* ---------- TASK BATCHING ---------- */
-
-function prepareBatch() {
-  allTasks = [];
-  const batch = document.getElementById("batchArea");
-  batch.innerHTML = "";
-
-  goals.forEach((goal, i) => {
-    const lines = document.getElementById("tasks" + i).value
-      .split("\n")
-      .filter(x => x.trim());
-
-    lines.forEach(task => {
-      const id = allTasks.length;
-
-      allTasks.push({
-        task,
-        goal: goal.name,
-        color: goal.color,
-        deleted: false
-      });
-
-      batch.innerHTML += `
-        <div class="task-box" id="task${id}">
-          <strong>${task}</strong>
-          <span class="delete" onclick="deleteTask(${id})">✕</span>
-          <div class="color-bar" id="bar${id}" style="background:${goal.color}"></div>
-          <input type="color" id="color${id}" value="${goal.color}"
-            onchange="updateColor(${id})">
-          <div class="days">
-            ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>`
-              <label>
-                <input type="checkbox" id="${id}${d}"> ${d}
-              </label>
-            `).join("")}
-          </div>
-        </div>`;
+  const data = await res.json();
+  if (!res.ok) throw new Error(data.error || "Request failed");
+  return data;
+}
+
+function renderInfrastructure(rows) {
+  infraBody.innerHTML = rows
+    .map(
+      (r) => `
+      <tr>
+        <td>${r.id}</td>
+        <td>${r.name}</td>
+        <td>${r.type}</td>
+        <td>${r.location}</td>
+      </tr>`
+    )
+    .join("");
+}
+
+function renderSensors(rows) {
+  sensorBody.innerHTML = rows
+    .map(
+      (r) => `
+      <tr>
+        <td>${r.infra_id}</td>
+        <td>${r.infra_name || "-"}</td>
+        <td>${r.sensor_value}</td>
+        <td>${r.status}</td>
+        <td>${r.timestamp}</td>
+      </tr>`
+    )
+    .join("");
+}
+
+function renderAlerts(rows) {
+  alertBody.innerHTML = rows
+    .map(
+      (r) => `
+      <tr>
+        <td>${r.alert_id}</td>
+        <td>${r.infra_id}</td>
+        <td>${r.infra_name || "-"}</td>
+        <td>${r.message}</td>
+        <td>${r.status}</td>
+      </tr>`
+    )
+    .join("");
+}
+
+async function refreshAll() {
+  const [infra, sensors, alerts] = await Promise.all([
+    api("/api/infrastructure"),
+    api("/api/sensordata"),
+    api("/api/alerts")
+  ]);
+
+  renderInfrastructure(infra);
+  renderSensors(sensors);
+  renderAlerts(alerts);
+}
+
+document.getElementById("infraForm").addEventListener("submit", async (e) => {
+  e.preventDefault();
+  try {
+    await api("/api/infrastructure", {
+      method: "POST",
+      body: JSON.stringify({
+        name: document.getElementById("infraName").value.trim(),
+        type: document.getElementById("infraType").value,
+        location: document.getElementById("infraLocation").value.trim()
+      })
     });
-  });
-
-  next();
-}
-
-function updateColor(id) {
-  const color = document.getElementById("color" + id).value;
-  document.getElementById("bar" + id).style.background = color;
-  allTasks[id].color = color;
-}
-
-function deleteTask(id) {
-  allTasks[id].deleted = true;
-  document.getElementById("task" + id).remove();
-}
-
-/* ---------- TIMETABLE ---------- */
-
-function generate() {
-  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
-  const table = {};
-  const legendMap = {};
-
-  days.forEach(d => table[d] = []);
-
-  allTasks.forEach((t, i) => {
-    if (t.deleted) return;
-    if (!legendMap[t.goal]) legendMap[t.goal] = t.color;
-
-    days.forEach(d => {
-      const box = document.getElementById(i + d);
-      if (box && box.checked) {
-        table[d].push(t);
-      }
+    e.target.reset();
+    await refreshAll();
+    showMessage("Infrastructure added");
+  } catch (error) {
+    showMessage(error.message, true);
+  }
+});
+
+document.getElementById("sensorForm").addEventListener("submit", async (e) => {
+  e.preventDefault();
+  try {
+    await api("/api/sensordata", {
+      method: "POST",
+      body: JSON.stringify({
+        infra_id: Number(document.getElementById("sensorInfraId").value),
+        sensor_value: Number(document.getElementById("sensorValue").value),
+        status: document.getElementById("sensorStatus").value.trim()
+      })
     });
-  });
-
-  const grid = document.getElementById("table");
-  grid.innerHTML = "";
-
-  days.forEach(d => {
-    grid.innerHTML += `
-      <div class="day-column">
-        <h4>${d}</h4>
-        ${table[d].map(t => `
-          <div class="task" style="background:${t.color}33;
-               box-shadow: inset 6px 0 0 ${t.color}">
-            ${t.task}
-          </div>
-        `).join("")}
-      </div>`;
-  });
-
-  const legend = document.getElementById("legend");
-  legend.innerHTML = Object.entries(legendMap).map(
-    ([goal, color]) => `
-      <div class="legend-item">
-        <span class="legend-color" style="background:${color}"></span>
-        ${goal}
-      </div>
-    `
-  ).join("");
-
-  next();
-}
-
-/* INIT */
-updateUI();
-// ================= ROOT CONTAINER =================
-document.body.style.margin = "0";
-document.body.style.fontFamily = "Arial";
-
-// ================= SIDE PANEL =================
-const sidePanel = document.createElement("div");
-sidePanel.style.width = "220px";
-sidePanel.style.height = "100vh";
-sidePanel.style.borderRight = "2px solid black";
-sidePanel.style.padding = "10px";
-sidePanel.style.boxSizing = "border-box";
-sidePanel.style.float = "left";
-
-// Title
-const panelTitle = document.createElement("h3");
-panelTitle.innerText = "SIDE PANEL";
-sidePanel.appendChild(panelTitle);
-
-sidePanel.appendChild(document.createElement("hr"));
-
-// Button creator
-function createButton(text, clickFn) {
-    const btn = document.createElement("button");
-    btn.innerText = text;
-    btn.style.display = "block";
-    btn.style.marginBottom = "10px";
-    btn.style.width = "100%";
-    btn.onclick = clickFn;
-    return btn;
-}
-
-// ================= MAIN CONTENT =================
-const mainContent = document.createElement("div");
-mainContent.style.marginLeft = "240px";
-mainContent.style.padding = "15px";
-
-// ================= MODULE FUNCTIONS =================
-
-// 1️⃣ Planner
-function showPlanner() {
-    mainContent.innerHTML = `
-        <h2>📅 Planner</h2>
-        <p>
-        Planner module allows users to convert goals into tasks and generate
-        a focused 7-day timetable.
-        </p>
-        <ul>
-            <li>Goals → Tasks</li>
-            <li>Day batching</li>
-            <li>Weekly timetable generation</li>
-            <li>Color coding</li>
-        </ul>
-    `;
-}
-
-// 2️⃣ Day Plan & Progress
-function showDayPlan() {
-    mainContent.innerHTML = `
-        <h2>📊 Day Plan & Progress</h2>
-
-        <h3>Today – Monday</h3>
-        <ul>
-            <li>☐ Gym</li>
-            <li>☐ Java Practice</li>
-            <li>☐ Healthy Diet</li>
-        </ul>
-
-        <h3>Progress</h3>
-        <button>20%</button>
-        <button>40%</button>
-        <button>60%</button>
-        <button>80%</button>
-        <button>100%</button>
-
-        <p>
-            <strong>Completed:</strong> 2 / 4 <br>
-            <strong>Productivity:</strong> 60%
-        </p>
-
-        <p>
-        “Day Plan module helps users avoid overthinking by focusing only on
-        today’s progress.”
-        </p>
-    `;
-}
-
-// 3️⃣ Rewards & Penalty
-function showRewards() {
-    mainContent.innerHTML = `
-        <h2>🏆 Rewards & Penalty</h2>
-
-        <h3>Rewards</h3>
-        <ul>
-            <li>✔ 1 Day – All tasks complete → 🎁 Watch movie</li>
-            <li>✔ 3 Days – Regular → 🎁 Eat outside</li>
-            <li>✔ 7 Days – Perfect week → 🎁 Buy something special</li>
-        </ul>
-
-        <h3>Penalty</h3>
-        <ul>
-            <li>❌ Tasks missed today → ⚠ No social media</li>
-            <li>❌ 2 days missed → ⚠ Extra workout / study</li>
-        </ul>
-
-        <p>
-        “Reward and penalty system motivates discipline through positive
-        and negative reinforcement.”
-        </p>
-    `;
-}
-
-// 4️⃣ Logout
-function logout() {
-    localStorage.clear();
-    mainContent.innerHTML = `
-        <h2>🚪 Logout</h2>
-        <p>Logout ensures data privacy and fresh session handling.</p>
-    `;
-}
-
-// ================= ADD BUTTONS =================
-sidePanel.appendChild(createButton("📅 Planner", showPlanner));
-sidePanel.appendChild(createButton("📊 Day Plan & Progress", showDayPlan));
-sidePanel.appendChild(createButton("🏆 Rewards & Penalty", showRewards));
-sidePanel.appendChild(createButton("🚪 Logout", logout));
-
-// ================= APPEND TO PAGE =================
-document.body.appendChild(sidePanel);
-document.body.appendChild(mainContent);
-
-// Default screen
-showPlanner();
-<!DOCTYPE html>
-<html>
-<head>
-    <title>Contrast Colours using JavaScript</title>
-    <style>
-        body {
-            font-family: Arial;
-            text-align: center;
-            padding-top: 50px;
-        }
-
-        #box {
-            padding: 30px;
-            margin: 20px auto;
-            width: 60%;
-            border-radius: 10px;
-            font-size: 20px;
-        }
-
-        button {
-            padding: 10px 20px;
-            font-size: 16px;
-            cursor: pointer;
-        }
-    </style>
-</head>
-<body>
-<!DOCTYPE html>
-<html lang="en">
-<head>
-<meta charset="UTF-8">
-<title>Dark Contrast Button</title>
-
-<style>
-    body {
-        background: #f4f6f8;
-        color: #111;
-        font-family: Arial, sans-serif;
-        transition: 0.3s;
-    }
-
-    /* Example content */
-    .box {
-        background: white;
-        padding: 20px;
-        margin: 60px auto;
-        width: 70%;
-        border-radius: 10px;
-    }
-
-    /* DARK CONTRAST MODE */
-    .dark-mode {
-        background: #000;
-        color: #fff;
-    }
-
-    .dark-mode .box {
-        background: #111;
-        color: #fff;
-    }
-
-    /* Button */
-    #toggleBtn {
-        position: fixed;
-        top: 20px;
-        right: 20px;
-        padding: 10px 18px;
-        border: none;
-        border-radius: 20px;
-        background: #2563eb;
-        color: white;
-        font-size: 15px;
-        cursor: pointer;
-    }
-</style>
-</head>
-
-<body>
-
-<button id="toggleBtn">🌙 Dark Mode</button>
-
-<div class="box">
-    <h2>Website Content</h2>
-    <p>Click the button to change site colors to dark contrast mode.</p>
-</div>
-
-<script>
-    const btn = document.getElementById("toggleBtn");
-
-    btn.addEventListener("click", function () {
-        document.body.classList.toggle("dark-mode");
-
-        if (document.body.classList.contains("dark-mode")) {
-            btn.textContent = "☀ Light Mode";
-        } else {
-            btn.textContent = "🌙 Dark Mode";
-        }
+    e.target.reset();
+    await refreshAll();
+    showMessage("Sensor data added");
+  } catch (error) {
+    showMessage(error.message, true);
+  }
+});
+
+document.getElementById("alertForm").addEventListener("submit", async (e) => {
+  e.preventDefault();
+  try {
+    await api("/api/alerts", {
+      method: "POST",
+      body: JSON.stringify({
+        infra_id: Number(document.getElementById("alertInfraId").value),
+        message: document.getElementById("alertMessage").value.trim(),
+        status: document.getElementById("alertStatus").value
+      })
     });
-</script>
+    e.target.reset();
+    await refreshAll();
+    showMessage("Alert added");
+  } catch (error) {
+    showMessage(error.message, true);
+  }
+});
 
-</body>
-</html>
+refreshAll().catch((error) => showMessage(error.message, true));
 
EOF
)
