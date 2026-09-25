"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const tierColors = {
  "High Performer": "#4ade80",
  "Steady Performer": "#eab308",
  "Needs Support": "#f87171",
};

export default function PerformanceBarChart({ employees }) {
  const chartData = {
    labels: employees.map((e) => e.name),
    datasets: [
      {
        label: "Avg performance score",
        data: employees.map((e) => e.avgScore),
        backgroundColor: employees.map((e) => tierColors[e.tier] || "#3b6fe0"),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "#ece5d8" },
        ticks: { color: "#8a8375" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#8a8375" },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
