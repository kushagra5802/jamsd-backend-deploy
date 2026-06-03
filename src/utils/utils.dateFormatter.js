
class DateFormatter {
    // format: dd/mm/yyyy: 12/1/2023
    static standardDate(dateString) {
        let stdDate = new Date(dateString).toLocaleDateString();
        return stdDate;
    }

    //format: month and year only; oct 2022
    static monthYear(dateString) {
        let monthYearDate = new Date(dateString).toLocaleDateString('en-us', { year: "numeric", month: "short" });
        return monthYearDate;
    }

    //format: weekday "Friday, Jul 2, 2021"
    static weekDayDate(dateString) {
        let weekDayFormat = new Date(dateString).toLocaleDateString('en-us', { weekday: "long", year: "numeric", month: "short", day: "numeric" });
        return weekDayFormat;
    }

    //format: shortDash dd/mm/yy; 02-10-22
    static dashFormat(dateString) {
        const today = new Date(dateString);
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const dashFormatDate = dd + '-' + mm + '-' + yyyy;
        return dashFormatDate;
    }


        //format: shortDash dd/mm/yy; 02-10-22
        static getMonth(dateString) {
            const today = new Date(dateString);
            const yyyy = today.getFullYear();
            let mm = today.getMonth() + 1; // Months start at 0!
    
            if (mm < 10) mm = '0' + mm;
    
            const dashFormatDate = mm + '-' + yyyy;
            return dashFormatDate;
        }
    
    // console.log('date: ', standardDate("2013-11-02T01:11:18.965Z"));
    // console.log('mnth & Y: ', monthYear("2013-11-02T01:11:18.965Z"));
    // console.log('weekday: ', weekDayDate("2013-11-02T01:11:18.965Z"));
    // console.log('dash: ', dashFormat("2013-11-02T01:11:18.965Z"));

    static addMonthsToDate(dateStart, planDuration) {
        let validityEnd = new Date(dateStart);
    
         if(planDuration === "quarterly"){
            return validityEnd = validityEnd.setMonth(validityEnd.getMonth() + 3);
        }
        if(planDuration === "half_yearly"){
            return validityEnd = validityEnd.setMonth(validityEnd.getMonth() + 6);
        }
        if(planDuration === "yearly"){
            return validityEnd = validityEnd.setMonth(validityEnd.getMonth() + 12);
        }
    }

}

module.exports = DateFormatter;
