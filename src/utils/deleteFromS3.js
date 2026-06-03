// utils/deleteFromS3.js
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const AwsClient = require('../config/awsconfig');

module.exports.deleteFromS3 = async (key) => {
  if (!key) return;

  try {
    await AwsClient.s3Instance.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key
      })
    );
  } catch (err) {
    console.error('S3 delete failed:', err.message);
  }
};
