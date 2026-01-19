const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  set,
  update,
  remove,
  get,
  child,
} = require("firebase/database");
const Mirror = require("./models/Mirror");
const firebaseConfig = require("./config/firebase");

// --- APP SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// --- SYNC ENGINE: CLOUD -> LOCAL (On Startup) ---
async function performInitialSync() {
  console.log("⬇️  Starting Initial Cloud Sync...");

  try {
    // 1. Sync Holidays
    const holidaysSnap = await get(ref(db, "holidays"));
    if (holidaysSnap.exists()) {
      await updateLocalMirror("holidays", holidaysSnap.val());
    }

    // 2. Sync Config
    const configSnap = await get(ref(db, "config"));
    if (configSnap.exists()) {
      await updateLocalMirror("config", configSnap.val());
    }

    // 3. Sync Sections (Iterate to break down into granular mirrors)
    const sectionsSnap = await get(ref(db, "sections"));
    if (sectionsSnap.exists()) {
      const sections = sectionsSnap.val();
      for (const [sectionId, sectionData] of Object.entries(sections)) {
        if (sectionData.students) {
          await updateLocalMirror(
            `sections/${sectionId}/students`,
            sectionData.students,
          );
        }
        if (sectionData.attendance) {
          await updateLocalMirror(
            `sections/${sectionId}/attendance`,
            sectionData.attendance,
          );
        }
      }
    }
    console.log("✅ Initial Cloud Sync Complete. MongoDB is now up to date.");
  } catch (err) {
    console.error("❌ Initial Sync Failed:", err.message);
  }
}

async function updateLocalMirror(key, data) {
  // Update or Insert, but preserve 'synced' state if it exists (assume true for fresh pull)
  await Mirror.findOneAndUpdate(
    { key },
    { key, data, synced: true, timestamp: new Date() },
    { upsert: true, new: true },
  );
  console.log(`   -> Pulled ${key}`);
}

// --- DB CONNECTIONS ---
// 1. MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/attendance_hybrid_db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB (Local)");
    // Trigger Sync after Mongo connects
    await performInitialSync();
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 2. Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
console.log("✅ Connected to Firebase (Cloud)");

// --- HELPER: DEEP UPDATE ---
function setDeep(obj, pathParts, value) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!current || !current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = pathParts[pathParts.length - 1];
  if (value === null || value === undefined) {
    if (current) delete current[lastPart];
  } else {
    if (current) current[lastPart] = value;
  }
  return obj;
}

// --- SYNC MANAGER ---
// The app listens to 3 main "root" paths per section:
// - holidays (global)
// - sections/{id}/students
// - sections/{id}/attendance

// We map any incoming granular path to one of these Root Mirrors.
function getMirrorKey(path) {
  const parts = path.split("/");

  if (path.startsWith("holidays")) return "holidays";
  if (path.startsWith("config")) return "config";

  if (path.startsWith("sections")) {
    // sections/{id}/students or sections/{id}/attendance
    const sectionId = parts[1];
    const type = parts[2]; // 'students' or 'attendance'
    if (sectionId && type) {
      return `sections/${sectionId}/${type}`;
    }
  }
  return null; // Unknown path
}

// Ensure Mirror exists (Atomic Upsert to prevent race conditions)
async function getOrCreateMirror(key) {
  try {
    const mirror = await Mirror.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, data: {}, synced: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return mirror;
  } catch (error) {
    // Retry once on error (rare edge case with MongoDB upserts sometimes)
    console.warn(`Retry getOrCreateMirror due to: ${error.message}`);
    const mirror = await Mirror.findOne({ key });
    if (mirror) return mirror;
    throw error;
  }
}

// --- SOCKETS ---
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Client asks to subscribe to a data path (e.g. "sections/101/attendance")
  socket.on("subscribe", async (path) => {
    console.log(`Client subscribed to ${path}`);
    socket.join(path);

    // Send current local data immediately
    const mirror = await getOrCreateMirror(path);
    socket.emit("data_update", { path, data: mirror.data });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// --- API ---

// WRITE Endpoint
app.post("/api/write", async (req, res) => {
  // Action: 'set', 'update', 'push' (we treat push as set with new ID for simplicity in this bridge)
  // But wait, the hook uses 'push'. We need to handle generating IDs if 'push' is used.
  // Actually, for simplicity, let the Frontend generate IDs or handle 'push' by creating a random key.
  // We'll standardize on SET for specific paths.

  const { path, value } = req.body;
  // Value === null means delete/remove

  console.log(`📝 WRITE Request: ${path}`);

  try {
    const mirrorKey = getMirrorKey(path);
    if (!mirrorKey) {
      return res.status(400).json({ error: "Invalid path structure" });
    }

    // 1. Update MongoDB (The Source of Truth)
    const mirror = await getOrCreateMirror(mirrorKey);

    // Calculate relative path inside the mirror data
    // e.g. path = "sections/101/attendance/2023-01-01/studentId"
    // mirrorKey = "sections/101/attendance"
    // relative = "2023-01-01/studentId"
    let relativePath = path.replace(mirrorKey, "");
    if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);

    // Clone data to avoid mongoose caching weirdness
    // Fix: If mirror.data is null/undefined (e.g. was deleted), default to empty object
    let newData = mirror.data ? JSON.parse(JSON.stringify(mirror.data)) : {};

    if (!relativePath) {
      // Replacing the whole root
      // Fix: If deleting root, keep it as empty object localy to allow subsequent writes
      newData = value === null ? {} : value;
    } else {
      const parts = relativePath.split("/");
      // Fix: Ensure newData is an object before setting deep
      if (!newData || typeof newData !== "object") newData = {};
      setDeep(newData, parts, value);
    }

    mirror.data = newData;
    mirror.synced = false; // Mark dirty
    mirror.markModified("data");
    await mirror.save();

    // 2. Broadcast to local clients immediately
    io.to(mirrorKey).emit("data_update", { path: mirrorKey, data: newData });

    // 3. Try Sync to Firebase (Async)
    // We don't await this for the response, to make local UI snappy.
    syncToFirebase(path, value, mirror);

    res.json({ success: true });
  } catch (error) {
    console.error("Write Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function syncToFirebase(path, value, mirrorDoc) {
  try {
    // We try to write specifically to the deeper path in Firebase to save bandwidth
    const dbRef = ref(db, path);
    if (value === null) {
      await remove(dbRef);
    } else {
      await set(dbRef, value);
    }

    // If successful, and no other pending changes, mark synced?
    // This is tricky if multiple writes happen fast.
    // Simple approach: After success, check if we match.
    // Or just blindly mark synced=true if this was the latest write.
    // For this simple app:
    mirrorDoc.synced = true;
    await mirrorDoc.save();
    console.log(`☁️ Synced to Firebase: ${path}`);
  } catch (err) {
    console.warn(
      `⚠️ Offline or Firebase Error: ${err.message}. Data saved locally.`,
    );
    // Already marked synced=false
  }
}

// --- NETWORK MONITOR / SYNC WORKER ---
// Periodically check for unsynced documents and try to push them
setInterval(async () => {
  try {
    const dirtyMirrors = await Mirror.find({ synced: false });
    if (dirtyMirrors.length === 0) return;

    // Check internet connection first? Or just try.
    const connectedRef = ref(db, ".info/connected");
    const snap = await get(connectedRef);
    if (snap.val() === true) {
      console.log(`🔄 Syncing ${dirtyMirrors.length} pending mirrors...`);
      for (const mirror of dirtyMirrors) {
        try {
          // Push entire object to ensure consistency
          await set(ref(db, mirror.key), mirror.data);
          mirror.synced = true;
          await mirror.save();
          console.log(`✅ Synced ${mirror.key}`);
        } catch (e) {
          console.error(`Sync failed for ${mirror.key}:`, e.message);
        }
      }
    }
  } catch (e) {
    // console.log("Sync worker idle/error");
  }
}, 5000); // Check every 5 seconds

// Start Server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Hybrid Backend running on port ${PORT}`);
});
