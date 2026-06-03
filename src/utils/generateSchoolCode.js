module.exports = function generateSchoolCode(schoolName) {
  if (!schoolName) return null;

  return schoolName
    .replace(/[^a-zA-Z ]/g, "")   // remove symbols
    .split(" ")
    .filter(Boolean)
    .map(word => word[0])
    .join("")
    .toUpperCase();
};