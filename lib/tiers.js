const { kmeans } = require("./kmeans");

// Clusters employees into up to 3 tiers based on avgScore (primary) and avgHours
// (secondary), then labels each cluster by its centroid's avgScore — highest
// centroid score becomes "High Performer", lowest becomes "Needs Support".
function assignTiers(employeeSummaries) {
  const k = Math.min(3, employeeSummaries.length);
  const { assignments, centroids } = kmeans(employeeSummaries, k, ["avgScore", "avgHours"]);

  // Rank clusters by centroid avgScore, descending
  const order = centroids
    .map((c, idx) => ({ idx, score: c.avgScore }))
    .sort((a, b) => b.score - a.score)
    .map((c) => c.idx);

  const tierNames = ["High Performer", "Steady Performer", "Needs Support"];
  const labelForCluster = {};
  order.forEach((clusterIdx, rank) => {
    labelForCluster[clusterIdx] = tierNames[rank] || `Tier ${rank + 1}`;
  });

  return employeeSummaries.map((emp, i) => ({
    ...emp,
    tier: labelForCluster[assignments[i]],
  }));
}

module.exports = { assignTiers };
