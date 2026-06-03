const getDimensionLevel = (percentage) => {
  if (percentage >= 70) return "High";
  if (percentage >= 50) return "Moderate";
  return "Low";
}

module.exports = getDimensionLevel 