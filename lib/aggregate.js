// Performance score formula (0-100), built from the REAL template's fields —
// deliberately transparent, not a black box:
//   35% Self-Assessed Progress % (already 0-100, as the intern reported it)
//   25% Quality Rating (1-5, scaled to 0-100)
//   20% Employee Self-Rating (1-5, scaled to 0-100)
//   20% Hours efficiency (actualHours vs plannedHours — finishing at or
//       under planned time scores full credit; going over caps at 100,
//       it isn't further penalized since "took longer" isn't always bad)
// Then a flat penalty is subtracted based on that day's Blocker Severity,
// since a rough day with a serious blocker is a real (if soft) signal —
// None: 0, Low: 2, Medium: 5, High: 10, Critical: 20.
//
// Honest limitation, worth saying out loud: Quality Rating, Self-Assessed
// Progress, and Self-Rating are all self-reported by the same person on
// the same day, so they're correlated by construction, not three
// independent signals. Hours efficiency is the only objective-ish input.
// A manager sign-off field would make this meaningfully stronger.

const BLOCKER_PENALTY = { None: 0, Low: 2, Medium: 5, High: 10, Critical: 20 };

function computeScore(record) {
  const progressPart = clamp(record.selfAssessedProgress, 0, 100) * 0.35;
  const qualityPart = (clamp(record.qualityRating, 1, 5) / 5) * 100 * 0.25;
  const selfRatingPart = (clamp(record.selfRating, 1, 5) / 5) * 100 * 0.2;
  const efficiency = record.plannedHours > 0 ? Math.min(1, record.actualHours / record.plannedHours) : 1;
  const hoursPart = efficiency * 100 * 0.2;

  const penalty = BLOCKER_PENALTY[record.blockerSeverity] ?? 0;

  const raw = progressPart + qualityPart + selfRatingPart + hoursPart - penalty;
  return Math.round(clamp(raw, 0, 100) * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
    const avgActualHours =
      Math.round((recs.reduce((s, r) => s + r.actualHours, 0) / recs.length) * 10) / 10;

    return {
      name,
      avgScore,
      avgActualHours,
      trendSlope: Math.round(slope * 1000) / 1000,
      trendLabel: trendLabel(slope),
      daysRecorded: recs.length,
    };
  });
}

module.exports = { computeScore, withScores, dailyTrend, weeklyTrend, monthlyTrend, perEmployeeSummary };
