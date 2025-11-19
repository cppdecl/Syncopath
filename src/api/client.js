// src/api/client.js

const API_BASE = "http://localhost:10000";

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
