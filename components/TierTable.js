"use client";

const tierBadgeClass = {
  "High Performer": "badge-high",
  "Steady Performer": "badge-steady",
  "Needs Support": "badge-support",
};

const trendClass = {
  Improving: "trend-up",
  Declining: "trend-down",
  Steady: "trend-flat",
};

const trendArrow = {
  Improving: "↑",
  Declining: "↓",
  Steady: "→",
};

export default function TierTable({ employees }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Intern</th>
          <th>Avg Score</th>
          <th>Trend (regression)</th>
          <th>Tier (k-means)</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((emp) => (
          <tr key={emp.name}>
            <td>{emp.name}</td>
            <td>{emp.avgScore}</td>
            <td className={trendClass[emp.trendLabel]}>
              {trendArrow[emp.trendLabel]} {emp.trendLabel}
            </td>
            <td>
              <span className={`badge ${tierBadgeClass[emp.tier]}`}>{emp.tier}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
