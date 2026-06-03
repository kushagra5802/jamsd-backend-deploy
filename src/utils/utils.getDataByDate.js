const UserModel = require("../modules/user/user.model");
const ClientModel = require("../modules/client/client.model");
const Responses = require("./utils.response");
const { Forbidden, InternalServerError, Unauthorized } = require("http-errors");

class GetModelData {

    static async GetModelDataByDate(model) {
        try {

            var sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            let results = await model.aggregate([
                {
                    $addFields: {
                        newId: "$createdAt"
                    }
                },
                {
                    $match: {
                        createdAt: {
                            $gte: sevenDaysAgo
                        }
                    }
                },
                {
                    $project: {
                        createdAt: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        _id: 0,
                        newId: 1
                    },
                },
                {
                    $group: {
                        _id: "$createdAt",
                        y: {
                            $sum: 1
                        },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        y: 1,
                        x: "$_id"
                    },
                },
                {
                    $sort: {
                      x: 1
                    }
                  }
            ])

            if (!results) {
                throw Unauthorized("data does not exist");
            }
            return results;
        } catch (error) {
            throw Unauthorized(error);
        }
    };
}

module.exports = GetModelData;