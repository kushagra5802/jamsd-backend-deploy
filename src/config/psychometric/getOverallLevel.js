const getOverallLevel = (totalScore) => {
  if (totalScore >= 160) return "High";
  if (totalScore >= 120) return "Moderate";
  return "Low";
}

module.exports = getOverallLevel 