const UserModel = require("../modules/user/user.model");
const ClientUserModel = require("../modules/client/clientUser.model");
const ClientModel = require("../modules/client/client.model");
const Responses = require("../utils/utils.response");
const { Forbidden, InternalServerError, Unauthorized } = require("http-errors");

class manageAccessBasedRoleAndQuery {
    // Verify Client User Role
    static verifyClientUserRole = (clientRoles, queryObj = false) => {
        return async (req, res, next) => {
            if (!clientRoles.type.includes(req.authData.user.type)) {
                if (!clientRoles.role.includes(req.authData.user.role)) {
                    return res.status(403).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
                }
                return res.status(403).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role and all ${req.authData.user.type} user . Please contact Your admin To get access`));
            }

            let queryArray = await queryObj(req, res, next);
    
            let query = (queryArray['default']) ? queryArray['default'] : {};

            req.limit = req.query.limit;
            req.page = req.query.page;
            query = (queryArray[req.authData.user.role]) ? queryArray[req.authData.user.role] : query;
            req.query = query

            // update query if call by client user 
            next();
        };
    };

    static verifyClientUserQueryRole = (clientserQuery, queryObj = false) => {

        return async (req, res, next) => {

            if (clientserQuery.query && clientserQuery.query.userRole.includes(req.authData.user.role)) {
                if (!clientserQuery.query.clientUserStatus.includes(req.body.status)) {
                    return res.status(403).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
                }
            }

            if (clientserQuery.clientUserRole.includes(req.authData.user.role)) {
                if (!clientserQuery.clientStatus.includes(req.body.status)) {
                    return res.status(403).send(Responses.errorResponse(`Not accessible for ${req.authData.user.role} role`));
                }
            }

            let queryArray = await queryObj(req, res, next);
            req.query = queryArray[req.authData.user.role]
            if(queryArray == false){
                return res.status(403).send(Responses.errorResponse("Can't find assigned User!"));
            }else{
                next();
            }
        };
    };
}

module.exports = manageAccessBasedRoleAndQuery;