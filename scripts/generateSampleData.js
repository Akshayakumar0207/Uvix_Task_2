// Run once: node scripts/generateSampleData.js
// Produces data/dailyReports.json with dummy data shaped like the Intern Daily
// Report template: Date, Employee Name, Tasks Assigned, Tasks Completed,
// Quality Score (1-10), Hours Worked. Replace with real data via
// `npm run convert-excel` once you have the actual filled-in sheet.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SAMPLE_PENDING_TASKS = [
  "",
  "",
  "",
  "Waiting on code review",
  "Blocked on API access",
  "Following up with design team",
];

const employees = [
  { name: "Akshaya", baseQuality: 9.3, trend: 0.08 },   // strongest + still improving -> High Performer
  { name: "Ravi", baseQuality: 7, trend: 0.0 },         // steady
  { name: "Priya", baseQuality: 8.5, trend: -0.05 },    // slowly declining
  { name: "Karthik", baseQuality: 5.5, trend: 0.03 },   // low but improving
  { name: "Anu", baseQuality: 8, trend: 0.01 },         // solid, steady
];

const DAYS = 30;
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS);

function randBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

const records = [];

for (let d = 0; d < DAYS; d++) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + d);
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

  const dateStr = date.toISOString().slice(0, 10);

  for (const emp of employees) {
    const tasksAssigned = Math.round(randBetween(3, 6));
    const qualityDrift = emp.trend * d + (Math.random() - 0.5) * 1.5;
    const qualityScore = Math.min(10, Math.max(1, Math.round((emp.baseQuality + qualityDrift) * 10) / 10));
    const completionRate = Math.min(1, Math.max(0.4, (qualityScore / 10) + (Math.random() - 0.5) * 0.2));
    const tasksCompleted = Math.round(tasksAssigned * completionRate);
    const hoursWorked = randBetween(5, 8.5);

    records.push({
      id: crypto.randomUUID(),
      date: dateStr,
      employeeName: emp.name,
      tasksAssigned,
      tasksCompleted,
      qualityScore,
      hoursWorked,
      pendingTask: SAMPLE_PENDING_TASKS[Math.floor(Math.random() * SAMPLE_PENDING_TASKS.length)],
    });
  }
}

const outPath = path.join(__dirname, "..", "data", "dailyReports.json");
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log(`Wrote ${records.length} sample records to ${outPath}`);
