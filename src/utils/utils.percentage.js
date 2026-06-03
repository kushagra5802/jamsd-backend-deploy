
class Percentage {

    //convert num to %
    static numToPercentage(num, total) {
        let result = (num / total) * 100;
        return Math.round(result * 10) / 10;
    }

    //convert % to num
    static percentageToNum(percentage, total) {
        let result = (percentage / 100) * total;
        return Math.round(result * 10) / 10;
    }

    // console.log('percent:', numToPercentage(42.2, 1000) + "%");
    // console.log('num :', percentageToNum(4.1, 1000));

}
module.exports = Percentage;
