class Pagination {
    static paginatedResults(model, obj) {
        return async (req, res, next) => {
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)

            const startIndex = (page - 1) * limit
            const endIndex = page * limit

            const results = {}
            let query = {}

            if(req.authData.user.type === "client"){
                query = {
                    "clientId": req.authData.user.organisationId
                }
            }

            model.count(query, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    results.totleCount =  result;
                    results.totalPages = Math.ceil(result / limit);
                    if(results.totalPages === 0) results.totalPages = 1;
                }
            });

            if (endIndex < await model.countDocuments(query).exec()) {
                results.nextPage = page + 1;
            }

            if (page) {
                results.currentPage = page;
            }
            if (limit) {
                results.limit = limit;
            }

            if (startIndex > 0) {
                results.previousPage = page - 1;
            }

            try {
                results.results = await model.find(query, obj).sort({ createdAt: -1 }).limit(limit).skip(startIndex).exec()
                const noData = false;
                if (!results) {
                    throw Unauthorized("Client does not exist");
                }
                res.paginatedResults = {
                    status: 200,
                    message: results.results.length === 0 ? 'no data available' : "Data Found successfully",
                    data: results.results.length === 0 ? null : results,
                    error: false,
                };
                next()
            } catch (error) {
                return {
                    status: false,
                    data: null,
                    message: error.message,
                    error
                };
            }
        }
    };
}

module.exports = Pagination;