// Ordinary least squares — fits y = slope * x + intercept.
// x is typically a day-index (0, 1, 2...), y is the performance score.
// slope > 0  => trending up (improving)
// slope < 0  => trending down (declining)
// slope ~ 0  => flat/steady
function linearRegression(points) {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: points[0].y };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function trendLabel(slope) {
  // thresholds tuned for a 0-100 performance score over daily steps
  if (slope > 0.3) return "Improving";
  if (slope < -0.3) return "Declining";
  return "Steady";
}

module.exports = { linearRegression, trendLabel };
