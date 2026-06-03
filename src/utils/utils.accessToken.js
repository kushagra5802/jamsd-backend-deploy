const jwt = require("jsonwebtoken");
const Users = require("../modules/user/user.model");
const SchoolUser = require("../models/schoolUser.model");

//generating access token using username as parameter
class AccessToken {

    static generateAccessToken(user) {
        //payload is a string for jwt create method which is created with concatenating firstname, email,role,_id of user
        return jwt.sign({ user }, process.env.SECRET_KEY, { expiresIn: '12h' });
    }

    static verifyToken(req, res, next) {
        try {
            // Get auth header value
            const bearerHeader = req.headers['authorization'];
            // Check if bearer is undefined
            if (typeof bearerHeader !== 'undefined') {
                // Split at the space
                const bearer = bearerHeader.split(' ');
                // Get token from array
                const bearerToken = bearer[1];
                //verifying the token with secret
                jwt.verify(bearerToken, process.env.SECRET_KEY, async (err, authData) => {

                    if (err) {
                        return res.json({
                            status: false,
                            data: null,
                            message: "Access Denied",
                            error: err
                        });
                    }
                    //if no error return authdata and go to next function
                    else {

                        if (authData.user.type === "superadmin") {

                            const user = await Users.findOne({ _id: authData.user._id }, { userstatus: 1 });
                            if (!user) {
                                return res.json({
                                    status: false,
                                    data: null,
                                    message: "User does not exist",
                                    error: err
                                });
                            }

                            if (user.userstatus != "active") {
                                return res.json({
                                    status: false,
                                    data: null,
                                    message: "This account is suspended.",
                                    error: err
                                });
                            }
                        }
                        if (authData.user.type === "client") {
                            const user = await SchoolUser.findById(authData.user._id).select("isActive");
                            if (!user) {
                                return res.json({
                                    status: false,
                                    data: null,
                                    message: "User does not exist",
                                    error: err
                                });
                            }

                            if (!user.isActive) {
                                return res.json({
                                    status: false,
                                    data: null,
                                    message: "This account is suspended.",
                                    error: err
                                });
                            }
                        }
                        req.authData = authData;
                        next();
                    }
                })
            }
            else {
                // if bearer header is undefined
                return res.json({
                    status: 403,
                    data: null,
                    message: "Access Denied",
                    error: "Token undefined "
                });
            }

        } catch (error) {
            return res.json({
                status: 403,
                data: null,
                message: error.message,
                error: error
            });
        }

    }

    // static generateAccessTokenForCarder(user) {

    //     return jwt.sign({ user }, process.env.SECRET_KEY);
    // }

    // static verifyToken_CallBack_Only(req, res, next) {
    //     try {
    //         console.log(req.query?.state);
    //         // Get auth header value
    //         const bearerHeader = req.query?.state
    //         // Check if bearer is undefined
    //         if (typeof bearerHeader !== 'undefined') {
    //             // Split at the space
    //             // const bearer = bearerHeader.split(' ');
    //             // Get token from array
    //             const bearerToken = bearerHeader;
    //             //verifying the token with secret
    //             jwt.verify(bearerToken, process.env.SECRET_KEY, async (err, authData) => {

    //                 if (err) {
    //                     return res.json({
    //                         status: false,
    //                         data: null,
    //                         message: "Access Denied",
    //                         error: err
    //                     });
    //                 }
    //                 //if no error return authdata and go to next function
    //                 else {

    //                     if (authData.user.type === "superadmin") {

    //                         const user = await Users.findOne({ _id: authData.user._id }, { userstatus: 1 });
    //                         if (!user) {
    //                             return res.json({
    //                                 status: false,
    //                                 data: null,
    //                                 message: "User does not exist",
    //                                 error: err
    //                             });
    //                         }

    //                         if (user.userstatus != "active") {
    //                             return res.json({
    //                                 status: false,
    //                                 data: null,
    //                                 message: "This account is suspended.",
    //                                 error: err
    //                             });
    //                         }
    //                     }

    //                     if (authData.user.type === "client") {

    //                         const user = await ClientUser.findOne({ _id: authData.user._id }, {status: 1});
    //                         if (!user) {
    //                             return res.json({
    //                                 status: false,
    //                                 data: null,
    //                                 message: "User does not exist",
    //                                 error: err
    //                             });
    //                         }

    //                         if (user.status != "active") {
    //                             return res.json({
    //                                 status: false,
    //                                 data: null,
    //                                 message: "This account is suspended.",
    //                                 error: err
    //                             });
    //                         }
    //                     }
                        
    //                     req.authData = authData;
    //                     next();
    //                 }
    //             })
    //         }
    //         else {
    //             // if bearer header is undefined
    //             return res.json({
    //                 status: 403,
    //                 data: null,
    //                 message: "Access Denied",
    //                 error: "Token undefined "
    //             });
    //         }

    //     } catch (error) {
    //         return res.json({
    //             status: 403,
    //             data: null,
    //             message: error.message,
    //             error: error
    //         });
    //     }

    // }
    
}

module.exports = AccessToken;