// Run: npm run export-excel
// Takes the dummy data already powering the dashboard (data/dailyReports.json)
// and writes it out as a real, filled-in Excel file — so you have an actual
// "cloned the template and filled in dummy data" sheet to show, matching
// exactly what the dashboard is reading.

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const records = require("../data/dailyReports.json");

// Reformat field names to match the template's human-readable headers
const rows = records.map((r) => ({
  Date: r.date,
  "Employee Name": r.employeeName,
  "Tasks Assigned": r.tasksAssigned,
  "Tasks Completed": r.tasksCompleted,
  "Quality Score": r.qualityScore,
  "Hours Worked": r.hoursWorked,
  "Pending Task": r.pendingTask || "",
}));

const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Intern Daily Report");

const outPath = path.join(__dirname, "..", "Intern_Daily_Report_filled.xlsx");
XLSX.writeFile(workbook, outPath);

console.log(`Wrote ${rows.length} rows -> ${outPath}`);
