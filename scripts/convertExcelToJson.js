// Run: npm run convert-excel -- path/to/SomeEmployee_Report.xlsx
//
// Parses the REAL Intern Daily Report template shape: one filled file per
// employee, with their Name/Role/Month-Year/Email as header cells on the
// "Daily Report" sheet, followed by daily rows from row 5 onward.
//
// Since each intern submits their OWN copy of this file, running this once
// per employee's file MERGES their rows into data/dailyReports.json rather
// than overwriting it — existing rows for other employees (or the same
// employee's other dates) are kept. Re-running for the same employee+date
// updates that row instead of duplicating it.
//
// Column layout (Daily Report sheet, row 4 = headers, data from row 5):
//   A Date | B Day No. | C Today's Goal | D Task Description
//   E Task Category | F Tasks Completed | G Task Outcome/Result
//   H Evidence Link | I Planned Hrs | J Actual Hrs | K Quality Rating (1-5)
//   L Self-Assessed Progress % | M Challenges/Blockers | N Blocker Severity
//   O Tomorrow's Tasks | P Tomorrow's Goal | Q Employee Self-Rating (1-5)

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");

const DATA_PATH = path.join(__dirname, "..", "data", "dailyReports.json");
const SHEET_NAME = "Daily Report";

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000).toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run convert-excel -- path/to/Employee_Report.xlsx");
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.includes(SHEET_NAME) ? SHEET_NAME : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Header info: row 2 -> Employee Name (B2), Role (D2), Email (I2, merged I2:J2)
  const getCell = (addr) => sheet[addr]?.v;
  const employeeName = String(getCell("B2") || "").trim();
  const role = String(getCell("D2") || "").trim();
  const email = String(getCell("I2") || "").trim();

  if (!employeeName) {
    console.error(
      "Could not find an Employee Name in cell B2 of the 'Daily Report' sheet.\n" +
        "Make sure this is a filled copy of the real template (Name/Role/Email filled in at the top), not the blank template."
    );
    process.exit(1);
  }

  // Data rows start at row 5 (row 4 is the column header row)
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const newRecords = [];

  for (let rowNum = 5; rowNum <= range.e.r + 1; rowNum++) {
    const cell = (col) => sheet[`${col}${rowNum}`]?.v;
    const dateVal = normalizeDate(cell("A"));
    if (!dateVal) continue; // skip blank/unfilled rows

    newRecords.push({
      id: crypto.randomUUID(),
      employeeName,
      role,
      email,
      date: dateVal,
      todayGoal: String(cell("C") || ""),
      taskDescription: String(cell("D") || ""),
      taskCategory: String(cell("E") || "Other"),
      tasksCompleted: Number(cell("F")) || 0,
      taskOutcome: String(cell("G") || ""),
      evidenceLink: String(cell("H") || ""),
      plannedHours: Number(cell("I")) || 0,
      actualHours: Number(cell("J")) || 0,
      qualityRating: Number(cell("K")) || 1,
      selfAssessedProgress: Number(cell("L")) || 0,
      challenges: String(cell("M") || ""),
      blockerSeverity: String(cell("N") || "None"),
      tomorrowTasks: String(cell("O") || ""),
      tomorrowGoal: String(cell("P") || ""),
      selfRating: Number(cell("Q")) || 1,
    });
  }

  if (newRecords.length === 0) {
    console.error(
      `No filled-in daily rows found for ${employeeName} (checked rows 5+, column A for a date).\n` +
        "This looks like the blank template — fill in at least one day's row and try again."
    );
    process.exit(1);
  }

  // Merge: replace existing rows for this employee+date, keep everyone else's rows
  const existing = fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) : [];
  const newKeys = new Set(newRecords.map((r) => `${r.employeeName}|${r.date}`));
  const kept = existing.filter((r) => !newKeys.has(`${r.employeeName}|${r.date}`));
  const merged = [...kept, ...newRecords];

  fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2));
  console.log(
    `Imported ${newRecords.length} day(s) for ${employeeName} (${role || "no role given"}).\n` +
      `data/dailyReports.json now has ${merged.length} total rows across all employees.`
  );
}

main();
