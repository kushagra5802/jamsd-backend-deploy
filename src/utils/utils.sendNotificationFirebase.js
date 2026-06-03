const admin = require("firebase-admin");
const { getMobileId, removeMobileId } = require("../modules/fcm/fcm.service");
// const serviceAccount = require(process.env.SERVICE_FILE);

// admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
// });

const sendNotificationFirebase = async (clientId, body) => {
    try {
        let tokens = await getMobileId(clientId);
        if (tokens == null) {
            console.log("No tokens found");
            throw InternalServerError("No Users Found")
        }
        tokens = tokens.map((token) => token.fcmToken);

        const payload = {
            notification: body.notification,
            data: body.data,
        };
        let options = {
            priority: "high",
            timeToLive: 60 * 60 * 24,
        };

        // const response = await admin.messaging().sendToDevice(tokens, payload, options);
        // for (let i = 0; i < response.results.length; i++) {
        //     if (Object.keys(response.results[i])[0] == "error") {
        //         const errorMessage = response.results[i].error.errorInfo.code.split("/")[1];
        //         if (
        //             errorMessage === "invalid-registration-token" ||
        //             errorMessage === "registration-token-not-registered"
        //         ) {
        //             await removeMobileId(tokens[i]);
        //         }
        //         console.log("No Users Found")
        //         throw InternalServerError("No Users Found")
        //     }
        // } 
        const response = ""
        return response;
    } catch (error) {
        console.log({ error });
        return error;
    }
}

module.exports = sendNotificationFirebase;