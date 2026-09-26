// Run once: node scripts/generateSampleData.js
// Produces data/dailyReports.json matching the REAL Intern Daily Report
// template's fields (Daily Report sheet, columns A-Q) — not a guessed schema.
// See the "Instructions" sheet of the actual template for what each field means.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TASK_CATEGORIES = ["Development", "Testing", "Meeting", "Documentation", "Support", "Learning", "Other"];
const BLOCKER_SEVERITIES = ["None", "None", "None", "Low", "Medium", "High"]; // weighted toward "None"

const employees = [
  { name: "Akshaya", role: "Full Stack Intern", email: "akshaya@example.com", baseQuality: 4.6, trend: 0.03 }, // strongest -> High Performer
  { name: "Ravi", role: "Backend Intern", email: "ravi@example.com", baseQuality: 3.4, trend: 0.0 },            // steady
  { name: "Priya", role: "Frontend Intern", email: "priya@example.com", baseQuality: 4.2, trend: -0.02 },       // slowly declining
  { name: "Karthik", role: "QA Intern", email: "karthik@example.com", baseQuality: 2.7, trend: 0.015 },         // low but improving
  { name: "Anu", role: "Full Stack Intern", email: "anu@example.com", baseQuality: 3.9, trend: 0.005 },         // solid, steady
];

const DAYS = 30;
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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
    const drift = emp.trend * d + (Math.random() - 0.5) * 0.6;
    const qualityRating = Math.round(clamp(emp.baseQuality + drift, 1, 5));
    const selfRating = Math.round(clamp(emp.baseQuality + drift + (Math.random() - 0.5) * 0.8, 1, 5));
    const selfAssessedProgress = Math.round(clamp((qualityRating / 5) * 100 + (Math.random() - 0.5) * 15, 10, 100));
    const tasksCompleted = Math.round(clamp(2 + drift, 0, 5));
    const plannedHours = randBetween(4, 8);
    const actualHours = clamp(plannedHours + (Math.random() - 0.5) * 2, 2, 10);
    const blockerSeverity = BLOCKER_SEVERITIES[Math.floor(Math.random() * BLOCKER_SEVERITIES.length)];
    const taskCategory = TASK_CATEGORIES[Math.floor(Math.random() * TASK_CATEGORIES.length)];

    records.push({
      id: crypto.randomUUID(),
      employeeName: emp.name,
      role: emp.role,
      email: emp.email,
      date: dateStr,
      todayGoal: "",
      taskDescription: "",
      taskCategory,
      tasksCompleted,
      taskOutcome: "",
      evidenceLink: "",
      plannedHours: Math.round(plannedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      qualityRating,
      selfAssessedProgress,
      challenges: blockerSeverity === "None" ? "" : "Sample blocker for dummy data",
      blockerSeverity,
      tomorrowTasks: "",
      tomorrowGoal: "",
      selfRating,
    });
  }
}

const outPath = path.join(__dirname, "..", "data", "dailyReports.json");
fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
console.log(`Wrote ${records.length} sample records to ${outPath}`);
