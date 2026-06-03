const UserModel = require("../modules/user/user.model");
const ClientModel = require("../modules/client/client.model");
const ClientUserModel = require("../modules/client/clientUser.model");
const Responses = require("./utils.response");

class PreVerify{
    //verify existing users
     static async verifyUser(req, res, next) {
        try {
    
            //if req.method == "Get" then return req.query otherwise return req.body
            const { email, phone } = req.method == "GET" ? req.query : req.body;
    
            // check the user existance
            let exist;
            if(email) {
                exist =  await UserModel.findOne({ email });
            } else if (phone) {
                exist =  await UserModel.findOne({ phone });
            }
            
            if (!exist) return res.status(404).send( Responses.errorResponse("Can't find User! please enter correct email"));
            next();
    
        } catch (error) {
            return res.status(404).send(Responses.errorResponse("Authentication Error"));
        }
    };

    //verify existing clients
    static async verifyClient(req, res, next) {
        try {
    
            //if req.method == "Get" then return req.query otherwise return req.body
            const { email } = req.method == "GET" ? req.query : req.body;
    
            // check the user existance
            let exist = await ClientModel.findOne({ email });
            if (!exist) return res.status(404).send({ error: "Can't find client!" });
            next();
    
        } catch (error) {
            return res.status(404).send({ error: "Authentication Error" });
        }
    };

     //verify existing client User
     static async verifyClientUser(id, clientId) {
            // check the user existance
            let exist = await ClientUserModel.findOne({ _id: id , clientId: clientId});
            return exist;
    };

}

module.exports = PreVerify;