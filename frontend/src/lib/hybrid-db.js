import { io } from "socket.io-client";

// Connect to the Local Backend
// Use window.location.hostname to ensure it works whether on localhost or via Network IP (mobile)
const BACKEND_URL = `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000`;
const socket = io(BACKEND_URL);

// A simple ID generator for 'push'
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Mock Ref class
class QueryRef {
  constructor(path) {
    this.path = path;
    this.key = path.split("/").pop();
  }
}

// Mock DB object (not really used but needed for signature compatibility)
export const db = { type: "hybrid" };

export function ref(dbInstance, path) {
  return new QueryRef(path);
}

// Listeners Registry
const listeners = {};

// Handle incoming updates from Server
socket.on("data_update", ({ path, data }) => {
  // 'path' here is the Mirror Key (e.g. sections/101/attendance)
  // If we have a listener for this EXACT path, notify it.
  if (listeners[path]) {
    listeners[path](data);
  }
});

socket.on("connect", () => {
  console.log("✅ Hybrid DB Connected");
  // Re-subscribe to all active listeners on reconnect
  Object.keys(listeners).forEach((path) => {
    socket.emit("subscribe", path);
  });
});

export function onValue(queryRef, callback, cancelCallback) {
  const path = queryRef.path;

  // 1. Register callback wrapper
  // Firebase snapshot format: { val: () => data, exists: () => !!data }
  listeners[path] = (data) => {
    callback({
      val: () => data,
      exists: () => data !== null && data !== undefined,
    });
  };

  // 2. Subscribe on server
  socket.emit("subscribe", path);

  // 3. Return unsubscribe function
  return () => {
    delete listeners[path];
    // socket.emit('unsubscribe', path);
  };
}

// API Write
async function sendWrite(path, value) {
  try {
    await fetch(`${BACKEND_URL}/api/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, value }),
    });
  } catch (err) {
    console.error("Hybrid Write Error:", err);
    throw err;
  }
}

export async function set(queryRef, value) {
  return sendWrite(queryRef.path, value);
}

export async function remove(queryRef) {
  return sendWrite(queryRef.path, null);
}

export function push(parentRef, value) {
  const newId = generateId();
  const newPath = `${parentRef.path}/${newId}`;
  const newRef = new QueryRef(newPath);

  if (value !== undefined) {
    // If value is provided, treat as a write promise
    // But push usually returns a Thenable reference.
    // Simplifying: we return the Ref. The caller must await set(newRef) if they didn't pass value.
    // If they DID pass value, we fire the write.
    sendWrite(newPath, value);
  }

  return newRef;
}
