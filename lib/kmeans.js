// Minimal k-means for 1D or 2D points, e.g. [{ score: 82, hours: 7.2 }, ...].
// Deterministic init (spread across sorted values) instead of random seeding,
// so results are reproducible run to run — important for a demo/interview.

function distance(a, b, dims) {
  return Math.sqrt(dims.reduce((sum, d) => sum + (a[d] - b[d]) ** 2, 0));
}

function kmeans(points, k, dims, maxIterations = 50) {
  if (points.length === 0) return { assignments: [], centroids: [] };
  if (points.length <= k) {
    // Not enough points to form k distinct clusters — everyone is their own cluster
    return {
      assignments: points.map((_, i) => i),
      centroids: points.map((p) => ({ ...pick(p, dims) })),
    };
  }

  // Deterministic init: sort by first dimension, pick evenly spaced points as centroids
  const sorted = [...points].sort((a, b) => a[dims[0]] - b[dims[0]]);
  let centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.floor((i * (sorted.length - 1)) / (k - 1));
    return pick(sorted[idx], dims);
  });

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign each point to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = distance(points[i], centroids[c], dims);
        if (d < bestDist) {
          bestDist = d;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) changed = true;
      assignments[i] = bestCluster;
    }

    // Recompute centroids
    const newCentroids = centroids.map((_, c) => {
      const members = points.filter((_, i) => assignments[i] === c);
      if (members.length === 0) return centroids[c]; // keep old centroid if cluster is empty
      const centroid = {};
      for (const d of dims) {
        centroid[d] = members.reduce((sum, p) => sum + p[d], 0) / members.length;
      }
      return centroid;
    });

    centroids = newCentroids;
    if (!changed) break;
  }

  return { assignments, centroids };
}

function pick(obj, dims) {
  const out = {};
  for (const d of dims) out[d] = obj[d];
  return out;
}

module.exports = { kmeans };
