const UserModel = require("../modules/user/user.model");
const ClientModel = require("../modules/client/client.model");
const Responses = require("./utils.response");
const { Forbidden, InternalServerError, Unauthorized } = require("http-errors");
const { getReportingIds } = require("./utils.getReportingIds");
const ObjectId = require('mongoose').Types.ObjectId;

class getCompletionRate {

    static async getCompletionRateForLastSevenDays(model, req) {
        try {
            // Get current date info
            const currentDate = new Date();
            const currentDayOfWeek = currentDate.getDay();

            // Calculate Monday and Sunday of current week
            const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const mondayOfCurrentWeek = new Date(currentDate);
            mondayOfCurrentWeek.setDate(currentDate.getDate() - daysToMonday);
            mondayOfCurrentWeek.setHours(0, 0, 0, 0);

            const endOfCurrentWeek = new Date(mondayOfCurrentWeek);
            endOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
            endOfCurrentWeek.setHours(23, 59, 59, 999);

            // Pre-generate dateArray with formatted dates
            const dateArray = [];
            const tempDate = new Date(mondayOfCurrentWeek);

            for (let i = 0; i < 7; i++) {
                const year = tempDate.getFullYear();
                const month = String(tempDate.getMonth() + 1).padStart(2, '0');
                const day = String(tempDate.getDate()).padStart(2, '0');

                dateArray.push({
                    count: 0,
                    date: `${year}-${month}-${day}`
                });

                tempDate.setDate(tempDate.getDate() + 1);
            }

            // Build the match query
            let matchQuery = {
                updatedAt: { $gte: mondayOfCurrentWeek, $lte: endOfCurrentWeek },
                status: "complete"
            };

            if (req.authData.user.role === "constituency_manager") {
                const reportsToData = await getReportingIds(req.authData.user._id);
                const userIdSet = [req.authData.user._id, ...reportsToData];

                matchQuery['$or'] = [
                    { createdByUserId: { $in: userIdSet } },
                    { assignedToUserId: { $in: userIdSet } }
                ];
            } else {
                matchQuery.clientId = ObjectId(req.params.id);
            }

            // Single aggregation pipeline - simplified
            const results = await model.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$updatedAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id',
                        count: 1
                    }
                },
                { $sort: { date: 1 } }
            ]);

            // Create result map for O(1) lookups
            const resultsMap = {};
            results.forEach(result => {
                resultsMap[result.date] = result.count;
            });

            // Map results to dateArray with O(1) lookups instead of O(n) find operations
            return dateArray.map(item => ({
                date: item.date,
                count: resultsMap[item.date] || 0
            }));

        } catch (error) {
            console.log(error);
            throw Unauthorized(error);
        }
    }

    static async getWeeklyRate(model, req, status) {
        try {
            // Build the match query once
            let matchQuery = {};
            if (req.authData.user.role === "constituency_manager") {
                const reportsToData = await getReportingIds(req.authData.user._id);
                matchQuery = {
                    '$or': [
                        { createdByUserId: { $in: [req.authData.user._id, ...reportsToData] } },
                        { assignedToUserId: { $in: [req.authData.user._id, ...reportsToData] } }
                    ]
                };
            } else {
                matchQuery['clientId'] = ObjectId(req.params.id);
            }
            
            // Calculate date ranges more efficiently
            const currentDate = new Date();
            // Set to start of current week (Monday)
            const daysSinceMonday = (currentDate.getDay() + 6) % 7;
            currentDate.setDate(currentDate.getDate() - daysSinceMonday);
            currentDate.setHours(0, 0, 0, 0);
            
            // End date (Sunday of current week)
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            
            // Start date (going back 15 weeks from current week for a total of 16 weeks)
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - 7 * 15);
            startDate.setHours(0, 0, 0, 0);
            
            // Pre-calculate all week ranges (16 weeks total)
            const weekDates = [];
            let tempDay = new Date(startDate);
            
            while (tempDay <= endDate) {
                const endDateOfCurrentWeek = new Date(tempDay);
                endDateOfCurrentWeek.setDate(tempDay.getDate() + 6);
                endDateOfCurrentWeek.setHours(23, 59, 59, 999);
                
                weekDates.push({
                    startDate: new Date(tempDay),
                    endDate: new Date(endDateOfCurrentWeek),
                    formattedDate: formatDate(tempDay)
                });
                
                tempDay.setDate(tempDay.getDate() + 7);
            }
            
            // Format date once during week range calculation
            function formatDate(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            // Use Promise.all for parallel processing of all weeks
            const weekly = await Promise.all(weekDates.map(async (currWeek) => {
                const queryForThisWeek = { ...matchQuery };
                
                if (status && status === "complete") {
                    queryForThisWeek["status"] = "complete";
                    queryForThisWeek["updatedAt"] = {
                        $gte: currWeek.startDate,
                        $lte: currWeek.endDate
                    };
                } else {
                    queryForThisWeek["createdAt"] = {
                        $gte: currWeek.startDate,
                        $lte: currWeek.endDate
                    };
                }
                
                const thisWeeksData = await model.aggregate([
                    { $match: queryForThisWeek },
                    {
                        $group: {
                            _id: { "clientId": ObjectId(req.params.id) },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                
                return {
                    date: currWeek.formattedDate,
                    count: thisWeeksData.length ? thisWeeksData[0].count : 0
                };
            }));
            
            return weekly;
        } catch (error) {
            console.log('error: ', error);
            return error;
        }
    }

    static async getMonthlyRate(model, req, status) {
        try {
            // Build base match query based on user role
            let baseMatchQuery = {};

            if (req.authData.user.role === "constituency_manager") {
                const reportsToData = await getReportingIds(req.authData.user._id);
                const userIdSet = [req.authData.user._id, ...reportsToData];

                baseMatchQuery['$or'] = [
                    { createdByUserId: { $in: userIdSet } },
                    { assignedToUserId: { $in: userIdSet } }
                ];
            } else {
                baseMatchQuery.clientId = ObjectId(req.params.id);
            }

            // Add status condition if provided
            if (status && status === "complete") {
                baseMatchQuery.status = "complete";
            }

            // Calculate date ranges
            const currentDate = new Date();
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

            // Set start date to first day of month, 12 months ago (1 years)
            const startDate = new Date(currentDate);
            startDate.setMonth(currentDate.getMonth() - 12, 1);
            startDate.setHours(0, 0, 0, 0);

            // Generate month date ranges with pre-formatted date strings
            const monthRanges = [];
            const tempDate = new Date(startDate);

            while (tempDate <= endDate) {
                const monthStart = new Date(tempDate);
                const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0, 23, 59, 59, 999);

                // Format date string once during range generation
                const year = monthStart.getFullYear();
                const month = String(monthStart.getMonth() + 1).padStart(2, '0');
                const day = String(monthStart.getDate()).padStart(2, '0');

                monthRanges.push({
                    startDate: monthStart,
                    endDate: monthEnd,
                    formattedDate: `${year}-${month}-${day}`
                });

                // Move to next month
                tempDate.setMonth(tempDate.getMonth() + 1);
            }

            // Build single aggregation with $facet to process all months in one query
            const timeField = status === "complete" ? "updatedAt" : "createdAt";
            const facetStages = {};

            monthRanges.forEach((month, index) => {
                facetStages[`month${index}`] = [
                    {
                        $match: {
                            ...baseMatchQuery,
                            [timeField]: {
                                $gte: month.startDate,
                                $lte: month.endDate
                            }
                        }
                    },
                    {
                        $count: "count"
                    }
                ];
            });

            const aggregationResult = await model.aggregate([
                { $facet: facetStages }
            ]);

            // Process results
            const monthly = monthRanges.map((month, index) => {
                const monthResult = aggregationResult[0][`month${index}`];
                return {
                    date: month.formattedDate,
                    count: monthResult.length > 0 ? monthResult[0].count : 0
                };
            });

            return monthly;

        } catch (error) {
            console.log('error: ', error);
            return error;
        }
    }


    static async getQuarterlyRate(model, req, status) {
        try {
          // Pre-calculate date ranges
          const quarterDates = [];
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
          
          // Build all quarter date ranges at once
          for (let year = currentYear - 4; year <= currentYear; year++) {
            const lastQuarter = (year === currentYear) ? currentQuarter : 4;
            for (let quarter = 1; quarter <= lastQuarter; quarter++) {
              const quarterStart = new Date(year, (quarter - 1) * 3, 1);
              const quarterEnd = new Date(year, quarter * 3, 0);
              quarterEnd.setHours(23, 59, 59, 999);
              
              // Format the date once during creation
              const formattedDate = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
              
              quarterDates.push({
                startDate: quarterStart,
                endDate: quarterEnd,
                formattedDate
              });
            }
          }
          
          // Build base match query once
          let baseMatchQuery = {};
          if (req.authData.user.role === "constituency_manager") {
            const reportsToData = await getReportingIds(req.authData.user._id);
            const userIds = [req.authData.user._id, ...reportsToData];
            baseMatchQuery['$or'] = [
              { createdByUserId: { $in: userIds } },
              { assignedToUserId: { $in: userIds } }
            ];
          } else {
            baseMatchQuery['clientId'] = ObjectId(req.params.id);
          }
          
          // Add status to base query if needed
          if (status && status === "complete") {
            baseMatchQuery["status"] = "complete";
          }
          
          // Use a single aggregation query instead of multiple ones
          const dateField = (status && status === "complete") ? "updatedAt" : "createdAt";
          
          // Create a query that uses $facet to handle all quarters in one go
          const facetStages = {};
          
          quarterDates.forEach((quarter, index) => {
            facetStages[`q${index}`] = [
              {
                $match: {
                  ...baseMatchQuery,
                  [dateField]: {
                    $gte: quarter.startDate,
                    $lte: quarter.endDate
                  }
                }
              },
              {
                $count: "count"
              }
            ];
          });
          
          const results = await model.aggregate([
            { $facet: facetStages }
          ]);
          
          // Process results into the expected output format
          const quarterly = quarterDates.map((quarter, index) => {
            const facetResult = results[0][`q${index}`];
            const count = facetResult.length > 0 ? facetResult[0].count : 0;
            
            return {
              date: quarter.formattedDate,
              count
            };
          });
          
          return quarterly;
        } catch (error) {
          console.log('error: ', error);
          return error;
        }
      }


    static async getHalfYearlyRate(model, req, status) {
        try {
          // Build base match query based on user role
          let baseMatchQuery = {};
          
          if (req.authData.user.role === "constituency_manager") {
            const reportsToData = await getReportingIds(req.authData.user._id);
            const userIdSet = [req.authData.user._id, ...reportsToData];
            
            baseMatchQuery['$or'] = [
              { createdByUserId: { $in: userIdSet } },
              { assignedToUserId: { $in: userIdSet } }
            ];
          } else {
            baseMatchQuery.clientId = ObjectId(req.params.id);
          }
          
          // Add status condition if provided
          if (status && status === "complete") {
            baseMatchQuery.status = "complete";
          }
          
          // Calculate current half-year details
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;
          const currentHalfYear = currentMonth <= 6 ? 1 : 2;
          
          // Generate half-year date ranges with pre-formatted date strings
          const halfYearRanges = [];
          
          for (let year = currentYear - 4; year <= currentYear; year++) {
            const lastHalfYear = (year === currentYear) ? currentHalfYear : 2;
            
            for (let halfYear = 1; halfYear <= lastHalfYear; halfYear++) {
              const startDate = new Date(year, (halfYear - 1) * 6, 1);
              startDate.setHours(0, 0, 0, 0);
              
              const endDate = new Date(year, halfYear * 6, 0);
              endDate.setHours(23, 59, 59, 999);
              
              // Format date string once during range generation
              const formattedYear = startDate.getFullYear();
              const formattedMonth = String(startDate.getMonth() + 1).padStart(2, '0');
              const formattedDay = String(startDate.getDate()).padStart(2, '0');
              
              halfYearRanges.push({
                startDate,
                endDate,
                formattedDate: `${formattedYear}-${formattedMonth}-${formattedDay}`
              });
            }
          }
          
          // Build single aggregation with $facet to process all half-years in one query
          const timeField = status === "complete" ? "updatedAt" : "createdAt";
          const facetStages = {};
          
          halfYearRanges.forEach((halfYear, index) => {
            facetStages[`hy${index}`] = [
              {
                $match: {
                  ...baseMatchQuery,
                  [timeField]: {
                    $gte: halfYear.startDate,
                    $lte: halfYear.endDate
                  }
                }
              },
              {
                $count: "count"
              }
            ];
          });
          
          const aggregationResult = await model.aggregate([
            { $facet: facetStages }
          ]);
          
          // Process results
          const halfYearly = halfYearRanges.map((halfYear, index) => {
            const halfYearResult = aggregationResult[0][`hy${index}`];
            return {
              date: halfYear.formattedDate,
              count: halfYearResult.length > 0 ? halfYearResult[0].count : 0
            };
          });
          
          return halfYearly;
          
        } catch (error) {
          console.log('error: ', error);
          return error;
        }
      }

      static async getYearlyRate(model, req, status) {
        try {
          // Build base match query based on user role
          let baseMatchQuery = {};
          
          if (req.authData.user.role === "constituency_manager") {
            const reportsToData = await getReportingIds(req.authData.user._id);
            const userIdSet = [req.authData.user._id, ...reportsToData];
            
            baseMatchQuery['$or'] = [
              { createdByUserId: { $in: userIdSet } },
              { assignedToUserId: { $in: userIdSet } }
            ];
          } else {
            baseMatchQuery.clientId = ObjectId(req.params.id);
          }
          
          // Add status condition if provided
          if (status && status === "complete") {
            baseMatchQuery.status = "complete";
          }
          
          // Calculate year ranges
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const yearRanges = [];
          
          // Generate last 5 years ranges with pre-formatted date strings
          for (let year = currentYear - 4; year <= currentYear; year++) {
            const yearStart = new Date(year, 0, 1);
            yearStart.setHours(0, 0, 0, 0);
            
            const yearEnd = new Date(year, 11, 31);
            yearEnd.setHours(23, 59, 59, 999);
            
            // Format date string during range generation
            const formattedMonth = "01"; // January
            const formattedDay = "01"; // First day
            
            yearRanges.push({
              startDate: yearStart,
              endDate: yearEnd,
              formattedDate: `${year}-${formattedMonth}-${formattedDay}`
            });
          }
          
          // Build a single aggregation with $facet to process all years at once
          const timeField = status === "complete" ? "updatedAt" : "createdAt";
          const facetStages = {};
          
          yearRanges.forEach((yearRange, index) => {
            facetStages[`y${index}`] = [
              {
                $match: {
                  ...baseMatchQuery,
                  [timeField]: {
                    $gte: yearRange.startDate,
                    $lte: yearRange.endDate
                  }
                }
              },
              {
                $count: "count"
              }
            ];
          });
          
          const aggregationResult = await model.aggregate([
            { $facet: facetStages }
          ]);
          
          // Process results
          const yearly = yearRanges.map((yearRange, index) => {
            const yearResult = aggregationResult[0][`y${index}`];
            return {
              date: yearRange.formattedDate,
              count: yearResult.length > 0 ? yearResult[0].count : 0
            };
          });
          
          return yearly;
          
        } catch (error) {
          console.log('error: ', error);
          return error;
        }
      }

      static async getAddedRateForLastSevenDays(model, req) {
        try {
          // Calculate current week's Monday and Sunday in one go
          const currentDate = new Date();
          const currentDayOfWeek = currentDate.getDay();
          const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
          
          // Create Monday date object once
          const mondayOfCurrentWeek = new Date(currentDate);
          mondayOfCurrentWeek.setDate(currentDate.getDate() - daysToMonday);
          mondayOfCurrentWeek.setHours(0, 0, 0, 0);
          
          // Create Sunday date object once
          const sundayOfCurrentWeek = new Date(mondayOfCurrentWeek);
          sundayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + 6);
          sundayOfCurrentWeek.setHours(23, 59, 59, 999);
          
          // Pre-generate date array for the entire week with optimized date formatting
          const dateArray = [];
          const mondayTimestamp = mondayOfCurrentWeek.getTime();
          const oneDayMs = 86400000; // 24 hours in milliseconds
          
          for (let i = 0; i < 7; i++) {
            const date = new Date(mondayTimestamp + (i * oneDayMs));
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            dateArray.push({ 
              count: 0, 
              date: `${year}-${month}-${day}` 
            });
          }
          
          // Build match query once
          let matchQuery = {
            createdAt: { $gte: mondayOfCurrentWeek, $lte: sundayOfCurrentWeek }
          };
          
          if (req.authData.user.role === "constituency_manager") {
            const reportsToData = await getReportingIds(req.authData.user._id);
            const userIds = [req.authData.user._id, ...reportsToData];
            
            matchQuery['$or'] = [
              { createdByUserId: { $in: userIds } },
              { assignedToUserId: { $in: userIds } }
            ];
          } else {
            matchQuery['clientId'] = ObjectId(req.params.id);
          }
          
          // Optimize aggregation pipeline
          const results = await model.aggregate([
            { $match: matchQuery },
            { 
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                date: "$_id",
                count: 1
              }
            },
            { $sort: { date: 1 } }
          ]);
          
          // Efficiently merge results with date array using a map approach
          const resultMap = new Map(results.map(item => [item.date, item.count]));
          
          for (const item of dateArray) {
            if (resultMap.has(item.date)) {
              item.count = resultMap.get(item.date);
            }
          }
          
          return dateArray;
        } catch (error) {
          console.log(error);
          throw Unauthorized(error);
        }
      }
}

module.exports = getCompletionRate;