"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrendChart from "../components/TrendChart";
import PerformanceBarChart from "../components/PerformanceBarChart";
import TierTable from "../components/TierTable";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [granularity, setGranularity] = useState("daily");

  useEffect(() => {
    fetch("/api/dashboard-data")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "Failed to load data");
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">Error loading dashboard: {error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  const trendData = { daily: data.daily, weekly: data.weekly, monthly: data.monthly }[granularity];

  const topPerformer = data.employees[0];
  const overallAvg =
    Math.round((data.employees.reduce((s, e) => s + e.avgScore, 0) / data.employees.length) * 10) / 10;
  const needsSupportCount = data.employees.filter((e) => e.tier === "Needs Support").length;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <span className="brand">Uvix</span>
            <span className="brand-sub">Performance Dashboard</span>
          </div>
          <Link href="/team-lead" className="nav-link">
            Team Lead admin →
          </Link>
        </div>
      </header>

      <div className="container">
        <p className="subtitle">
          {data.recordCount} daily reports · {data.employees.length} interns · updated{" "}
          {new Date(data.generatedAt).toLocaleString()}
        </p>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Team average score</span>
            <span className="kpi-value">{overallAvg}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Top performer</span>
            <span className="kpi-value kpi-value-sm">{topPerformer?.name || "—"}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Needs support</span>
            <span className="kpi-value">{needsSupportCount}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Interns tracked</span>
            <span className="kpi-value">{data.employees.length}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Performance trend</h2>
            <div className="toggle-group">
              {["daily", "weekly", "monthly"].map((g) => (
                <button
                  key={g}
                  className={`toggle-btn ${granularity === g ? "active" : ""}`}
                  onClick={() => setGranularity(g)}
                >
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={trendData} />
        </div>

        <div className="two-col">
          <div className="card">
            <h2>Average score by intern</h2>
            <PerformanceBarChart employees={data.employees} />
          </div>

          <div className="card">
            <h2>Tiers &amp; trend (ML layer)</h2>
            <TierTable employees={data.employees} />
          </div>
        </div>
      </div>
    </>
  );
}
