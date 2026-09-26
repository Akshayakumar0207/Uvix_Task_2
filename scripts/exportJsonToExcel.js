// Run: npm run export-excel
// Takes the dummy data already powering the dashboard and writes it back out
// as REAL filled copies of the Intern Daily Report template — one .xlsx per
// employee, in the exact column layout (A-Q) the actual template uses, with
// their Name/Role/Email as header cells. This is what you'd hand over as
// "cloned the template and filled it with dummy data," per employee.

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const records = require("../data/dailyReports.json");

const HEADERS = [
  "Date", "Day No.", "Today's Goal", "Task Description (1-5, one per line)",
  "Task Category", "Tasks Completed", "Task Outcome / Result", "Evidence Link",
  "Planned Hrs", "Actual Hrs", "Quality Rating (1-5)", "Self-Assessed Progress %",
  "Challenges / Blockers", "Blocker Severity", "Tomorrow's Tasks (1-5, one per line)",
  "Tomorrow's Goal", "Employee Self-Rating (1-5)",
];

const byEmployee = {};
for (const r of records) {
  if (!byEmployee[r.employeeName]) byEmployee[r.employeeName] = [];
  byEmployee[r.employeeName].push(r);
}

const outDir = path.join(__dirname, "..", "filled-templates");
fs.mkdirSync(outDir, { recursive: true });

for (const [name, recs] of Object.entries(byEmployee)) {
  const sorted = [...recs].sort((a, b) => (a.date < b.date ? -1 : 1));
  const { role, email } = sorted[0];

  const rows = [
    ["DAILY WORK REPORT"],
    ["Employee Name", name, "Role", role, "Month / Year", sorted[0].date.slice(0, 7), "Email", email],
    [],
    HEADERS,
    ...sorted.map((r, i) => [
      r.date, i + 1, r.todayGoal, r.taskDescription, r.taskCategory, r.tasksCompleted,
      r.taskOutcome, r.evidenceLink, r.plannedHours, r.actualHours, r.qualityRating,
      r.selfAssessedProgress, r.challenges, r.blockerSeverity, r.tomorrowTasks,
      r.tomorrowGoal, r.selfRating,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");

  const safeName = name.replace(/[^a-z0-9]/gi, "_");
  const outPath = path.join(outDir, `${safeName}_Daily_Report.xlsx`);
  XLSX.writeFile(workbook, outPath);
  console.log(`Wrote ${sorted.length} rows -> ${outPath}`);
}
