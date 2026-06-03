const UserModel = require("../modules/user/user.model");
const ClientUserModel = require("../modules/client/clientUser.model");
const GrievanceModel = require("../modules/grievance/grievance.model");
const TaskModel = require("../modules/task/task.model");
const ClientModel = require("../modules/client/client.model");
const Responses = require("./utils.response");
const { Forbidden, InternalServerError, Unauthorized } = require("http-errors");

class manageAccessRole {
    // Verify Client User Role
    static verifyClientUserRole = (clientRoles) => {
        return async (req, res, next) => {

            if (clientRoles.type !== req.authData.user.type) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.type} type`));
            }

            if (clientRoles.query && clientRoles.query.role.includes(req.authData.user.role)) {
                if (req.params.id !== req.authData.user._id) {
                    return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user._id} user`));
                }

                req.query = {
                    _id: req.authData.user._id,
                    organisationId: req.authData.user.organisationId,
                    page: req.query.page,
                    limit: req.query.limit,
                    sort: req.query.sort
                }

                return next();

            } else if (!clientRoles.role.includes(req.authData.user.role)) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
            }

            let exist = await ClientModel.findOne({ _id: req.authData.user.organisationId });
            if (!exist) return res.status(404).send(Responses.errorResponse("Can't find Client! "));

            req.query = {
                _id: req.params.id,
                organisationId: req.authData.user.organisationId,
                page: req.query.page,
                limit: req.query.limit,
                sort: req.query.sort
            }

            next();
        };
    };

    // Verify Client User Role
    static verifyGetGrievanceByUserId = (clientRoles) => {
        return async (req, res, next) => {
            let query = {};

            console.log("query_type ------------- ", clientRoles.query.query_type);
            if (clientRoles.type !== req.authData.user.type) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.type} type`));
            }

            if (clientRoles.query && clientRoles.query.role.includes(req.authData.user.role)) {

                const queryObj = [
                    {
                        $match: {
                            clientId: req.authData.user.organisationId,
                            "_id": req.params.id,
                            "assignedToUserId": req.authData.user._id,
                            "createdByUserId": req.authData.user._id
                        }
                    }]

                let exist = await GrievanceModel.aggregate(queryObj);
                if (!exist) return res.status(404).send(Responses.errorResponse("Can't find Grievance! "));

                req.query = {
                    _id: req.params.id,
                    clientId: req.authData.user.organisationId,
                    assignedToUserId: req.authData.user._id,
                    createdByUserId: req.authData.user._id
                }

                return next();

            } else if (!clientRoles.role.includes(req.authData.user.role)) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
            }

            req.query = {
                _id: req.params.id,
                clientId: req.authData.user.organisationId
            }

            next();
        };
    };

    static verifyGetTaskByUserId = (clientRoles) => {
        return async (req, res, next) => {

            if (clientRoles.type !== req.authData.user.type) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.type} type`));
            }

            if (clientRoles.query && clientRoles.query.role.includes(req.authData.user.role)) {

                const queryObj = [
                    {
                        $match: {
                            clientId: req.authData.user.organisationId,
                            "_id": req.params.id,
                            "assignedToUserId": req.authData.user._id,
                            "createdByUserId": req.authData.user._id
                        }
                    }];

                let exist = await TaskModel.aggregate(queryObj);
                if (!exist) return res.status(404).send(Responses.errorResponse("Can't find Task "));

                req.query = {
                    _id: req.params.id,
                    clientId: req.authData.user.organisationId,
                    assignedToUserId: req.authData.user._id,
                    createdByUserId: req.authData.user._id
                }

                return next();

            } else if (!clientRoles.role.includes(req.authData.user.role)) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
            }

            req.query = {
                _id: req.params.id,
                clientId: req.authData.user.organisationId
            }

            next();
        };
    };

    static verifyUserRole = (clientRoles) => {
        return async (req, res, next) => {

            if (clientRoles.type !== req.authData.user.type) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.type} type`));
            }

            if (clientRoles.query && clientRoles.query.role.includes(req.authData.user.role)) {

                const DBModel = clientRoles.query.DMmodel;
                console.log("DBModel ------- ", DBModel);
                const queryObj = [
                    {
                        $match: {
                            clientId: req.authData.user.organisationId,
                        }
                    }];
                console.log("---------", queryObj);
                let exist = await GrievanceModel.aggregate(queryObj);
                console.log("exist --------- ", exist);
                if (!exist) return res.status(404).send(Responses.errorResponse("Can't find Task "));

                req.query = [
                    {
                        $match: {
                            _id: req.params.id,
                            clientId: req.authData.user.organisationId,
                            assignedToUserId: req.authData.user._id,
                            createdByUserId: req.authData.user._id
                        }
                    }];

                return next();

            } else if (!clientRoles.role.includes(req.authData.user.role)) {
                return res.status(401).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
            }

            req.query = {
                _id: req.params.id,
                clientId: req.authData.user.organisationId
            }

            next();
        };
    };

    // static async verifyClientUserRole(req, res, next) {
    //     try {

    //         let clientUserRole = [ "client", "chief_of_staff"]


    //         console.log(" Type : ", req);
    //         if(!clientUserRole.includes(req.authData.user.role)){
    //             throw Unauthorized(`Not accessible for ${req.authData.user.role} role`);
    //         }

    //         // check the user existance
    //         let exist = await ClientModel.findOne({ _id:  req.authData.user.organisationId});
    //         console.log("Client user");
    //         if (!exist) return res.status(404).send( Responses.errorResponse("Can't find Client! "));

    //         next();

    //     } catch (error) {
    //         return res.status(404).send(Responses.errorResponse("Authentication Error"));
    //     }
    // };
}

module.exports = manageAccessRole;