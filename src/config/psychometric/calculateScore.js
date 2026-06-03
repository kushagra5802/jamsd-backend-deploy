const calculateScore = (selectedOption, isPositive) => {
  return isPositive ? selectedOption : (6 - selectedOption);
}

module.exports = calculateScore 