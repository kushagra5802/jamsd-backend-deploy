const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const ObjectId = require('mongoose').Types.ObjectId;

class GenerateOrganizationalHierarchy {

    static segregateUsersByOffice(clientUsers) {
        const usersByOffice = {}
        for(const user of clientUsers) {
            const allOffices = Object.keys(usersByOffice)
            const { officeName: currentUsersOffice } = user;
            if(allOffices.includes(currentUsersOffice)) {
                usersByOffice[currentUsersOffice].push(user);
            } else {
                usersByOffice[currentUsersOffice] = [{ ...user }]
            }
        }
        return usersByOffice
    }

    static async createPreSignedURL(key) {
        const params = {
            Bucket: process.env.BUCKET,
            Key: key
        };

        const command = new GetObjectCommand(params);
        let accessKeyId = process.env.ACCESS_KEY;
        let secretAccessKey = process.env.ACCESS_SECRET;
        const s3Client = new S3Client({ credentials: { accessKeyId, secretAccessKey }, region: process.env.REGION });
        let getUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return getUrl;
    }

    // Recursive function which creates organizational hierarchy
    static async appendObject(mainObj, clientUsers) {
        const { _id, role } = mainObj;
        // generate Pre Signed URL
        if(mainObj?.profileImageLink?.key) {
            mainObj.profileImageLink.publicUrl = await GenerateOrganizationalHierarchy.createPreSignedURL(mainObj.profileImageLink.key);
        }

        const findClientUserWithThisRole = clientUsers.filter(
            obj => ObjectId(obj.reportsTo).toString() === ObjectId(_id).toString()
        )

        if(findClientUserWithThisRole.length) {
            let worksUnder = [];
            for await(const user of findClientUserWithThisRole) {
                const workingUnderCurrentUser = await GenerateOrganizationalHierarchy.appendObject(user, clientUsers);
                worksUnder.push(workingUnderCurrentUser);
            }
            if(role === 'constituency_manager') {
                worksUnder = [GenerateOrganizationalHierarchy.segregateUsersByOffice(worksUnder)]
            }

            mainObj["worksUnder"] = worksUnder;
        }

        return mainObj;
    }

    static async generateHierarchy(clintUsersObj) {
        let client;
        client = clintUsersObj.find((obj) => obj.role === 'client');
        if (!client) {
           client = clintUsersObj.find((obj) => obj.role === 'constituency_manager'); 
        }

        const hierarchy = await GenerateOrganizationalHierarchy.appendObject(client, clintUsersObj)
        return hierarchy
    }
}

module.exports = GenerateOrganizationalHierarchy;
