// Performance score formula (0-100), computed from the sheet's own fields —
// deliberately simple and explainable rather than a black box:
//   40% task completion rate (tasksCompleted / tasksAssigned)
//   40% quality score (qualityScore out of 10)
//   20% hours worked, capped at a full 8-hour day
function computeScore(record) {
  const completionRate = record.tasksAssigned > 0 ? record.tasksCompleted / record.tasksAssigned : 0;
  const completionPart = Math.min(1, completionRate) * 40;
  const qualityPart = (record.qualityScore / 10) * 40;
  const hoursPart = (Math.min(record.hoursWorked, 8) / 8) * 20;
  return Math.round((completionPart + qualityPart + hoursPart) * 10) / 10;
}

function withScores(records) {
  return records.map((r) => ({ ...r, performanceScore: computeScore(r) }));
}

function isoWeekKey(dateStr) {
  const date = new Date(dateStr);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

// Groups scored records by a key function, averaging performanceScore per group (overall)
function groupOverall(scoredRecords, keyFn) {
  const groups = {};
  for (const r of scoredRecords) {
    const key = keyFn(r.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r.performanceScore);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, scores]) => ({
      period,
      avgScore: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));
}

function dailyTrend(scoredRecords) {
  return groupOverall(scoredRecords, (d) => d);
}
function weeklyTrend(scoredRecords) {
  return groupOverall(scoredRecords, isoWeekKey);
}
function monthlyTrend(scoredRecords) {
  return groupOverall(scoredRecords, monthKey);
}

// Per-employee summary: average score + linear-regression trend over the period
function perEmployeeSummary(scoredRecords, linearRegression, trendLabel) {
  const byEmployee = {};
  for (const r of scoredRecords) {
    if (!byEmployee[r.employeeName]) byEmployee[r.employeeName] = [];
    byEmployee[r.employeeName].push(r);
  }

  return Object.entries(byEmployee).map(([name, recs]) => {
    const sorted = [...recs].sort((a, b) => (a.date > b.date ? 1 : -1));
    const points = sorted.map((r, i) => ({ x: i, y: r.performanceScore }));
    const { slope } = linearRegression(points);
    const avgScore =
      Math.round((recs.reduce((s, r) => s + r.performanceScore, 0) / recs.length) * 10) / 10;
    const avgHours =
      Math.round((recs.reduce((s, r) => s + r.hoursWorked, 0) / recs.length) * 10) / 10;

    return {
      name,
      avgScore,
      avgHours,
      trendSlope: Math.round(slope * 1000) / 1000,
      trendLabel: trendLabel(slope),
      daysRecorded: recs.length,
    };
  });
}

module.exports = { computeScore, withScores, dailyTrend, weeklyTrend, monthlyTrend, perEmployeeSummary };
