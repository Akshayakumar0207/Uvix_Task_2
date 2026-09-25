// File-based store for the Team Lead admin panel.
//
// Works fully when running locally (npm run dev / npm start) — reads and
// writes data/dailyReports.json directly. On Vercel's serverless functions
// the filesystem is ephemeral, so writes made through the deployed admin
// panel are NOT guaranteed to persist across requests or survive a
// redeploy. Fine for demoing locally; for a fully persistent production
// version, swap this file's implementation for a real store (e.g. a
// hosted Postgres/Redis) and keep the same function signatures.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_PATH = path.join(process.cwd(), "data", "dailyReports.json");

function readAll() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

function writeAll(records) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2));
}

function addRecord(fields) {
  const records = readAll();
  const record = { id: crypto.randomUUID(), ...fields };
  records.push(record);
  writeAll(records);
  return record;
}

function updateRecord(id, fields) {
  const records = readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...fields, id };
  writeAll(records);
  return records[idx];
}

function deleteRecord(id) {
  const records = readAll();
  const filtered = records.filter((r) => r.id !== id);
  const wasDeleted = filtered.length !== records.length;
  if (wasDeleted) writeAll(filtered);
  return wasDeleted;
}

module.exports = { readAll, writeAll, addRecord, updateRecord, deleteRecord };
