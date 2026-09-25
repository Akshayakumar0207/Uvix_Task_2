import { readAll } from "../../../lib/store";
import { withScores, dailyTrend, weeklyTrend, monthlyTrend, perEmployeeSummary } from "../../../lib/aggregate";
import { linearRegression, trendLabel } from "../../../lib/regression";
import { assignTiers } from "../../../lib/tiers";

export async function GET() {
  try {
    const scored = withScores(readAll());

    const daily = dailyTrend(scored);
    const weekly = weeklyTrend(scored);
    const monthly = monthlyTrend(scored);

    const employeeSummaries = perEmployeeSummary(scored, linearRegression, trendLabel);
    const employees = assignTiers(employeeSummaries).sort((a, b) => b.avgScore - a.avgScore);

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      recordCount: scored.length,
      daily,
      weekly,
      monthly,
      employees,
    });
  } catch (err) {
    console.error("dashboard-data failed:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
