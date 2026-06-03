const AWS3 = require("@aws-sdk/client-s3");
const { S3Client } = require('@aws-sdk/client-s3');

let region = process.env.REGION || process.env.AWS_REGION;
let accessKeyId = process.env.ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
let secretAccessKey = process.env.ACCESS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;

// / Initializing S3 Interface V#
const s3Instance = new AWS3.S3Client({credentials: {accessKeyId, secretAccessKey}, region});

// Initializing S3Client
const s3 = new S3Client({credentials: {accessKeyId, secretAccessKey}, region});

module.exports = {
    s3Instance,
    s3
}
