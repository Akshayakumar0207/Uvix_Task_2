// Run: npm run convert-excel -- path/to/Intern_Daily_Report.xlsx
// Reads the first sheet and maps its columns to the fields the dashboard expects.
// Column name matching is case-insensitive and tolerant of common variations —
// if your sheet uses different headers, edit the `columnMap` below to match.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");

const columnMap = {
  date: ["date", "report date"],
  employeeName: ["employee name", "name", "intern name", "employee_name"],
  tasksAssigned: ["tasks assigned", "assigned tasks", "tasks_assigned"],
  tasksCompleted: ["tasks completed", "completed tasks", "tasks_completed"],
  qualityScore: ["quality score", "quality", "qualityscore", "quality_score"],
  hoursWorked: ["hours worked", "hours", "hours_worked"],
};

// Optional — won't block the import if missing from the sheet
const optionalColumnMap = {
  pendingTask: ["pending task", "pending", "pending_task", "blockers"],
};

function findColumn(headers, candidates) {
  const lowerHeaders = headers.map((h) => String(h).trim().toLowerCase());
  for (const candidate of candidates) {
    const idx = lowerHeaders.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    // Excel serial date
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + value * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  return String(value);
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run convert-excel -- path/to/Intern_Daily_Report.xlsx");
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    console.error("No rows found in the sheet.");
    process.exit(1);
  }

  const headers = Object.keys(rows[0]);
  const resolved = {};
  for (const field of Object.keys(columnMap)) {
    resolved[field] = findColumn(headers, columnMap[field]);
  }

  const resolvedOptional = {};
  for (const field of Object.keys(optionalColumnMap)) {
    resolvedOptional[field] = findColumn(headers, optionalColumnMap[field]);
  }

  const missing = Object.entries(resolved).filter(([, col]) => !col);
  if (missing.length > 0) {
    console.error(
      "Could not find columns for: " +
        missing.map(([field]) => field).join(", ") +
        `\nSheet headers found: ${headers.join(", ")}\n` +
        "Edit the columnMap in scripts/convertExcelToJson.js to match your sheet's headers."
    );
    process.exit(1);
  }

  const records = rows.map((row) => ({
    id: crypto.randomUUID(),
    date: normalizeDate(row[resolved.date]),
    employeeName: String(row[resolved.employeeName]).trim(),
    tasksAssigned: Number(row[resolved.tasksAssigned]) || 0,
    tasksCompleted: Number(row[resolved.tasksCompleted]) || 0,
    qualityScore: Number(row[resolved.qualityScore]) || 0,
    hoursWorked: Number(row[resolved.hoursWorked]) || 0,
    pendingTask: resolvedOptional.pendingTask ? String(row[resolvedOptional.pendingTask] || "").trim() : "",
  }));

  const outPath = path.join(__dirname, "..", "data", "dailyReports.json");
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`Converted ${records.length} rows -> ${outPath}`);
}

main();
