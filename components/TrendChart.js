"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendChart({ data }) {
  const chartData = {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: "Avg performance score",
        data: data.map((d) => d.avgScore),
        borderColor: "#3b6fe0",
        backgroundColor: "rgba(59, 111, 224, 0.15)",
        tension: 0.3,
        fill: true,
        pointRadius: 3,
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
        grid: { color: "#ece5d8" },
        ticks: { color: "#8a8375" },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
