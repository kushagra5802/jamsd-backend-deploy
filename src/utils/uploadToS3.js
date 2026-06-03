const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const { v4: uuid } = require('uuid');
const AwsClient = require('../config/awsconfig'); // your s3Instance

module.exports.uploadToS3 = async ({ files, userId, folder }) => {
  if (!files || files.length === 0) return [];
  const bucket = process.env.BUCKET || process.env.AWS_BUCKET || process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS S3 bucket is not configured.');
  }
  console.log("files",files)
  const uploadedFiles = [];

  for (const item of files) {
    const extension = path.extname(item.originalname);
    const safeName = path.basename(item.originalname, extension).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    const filename = `${folder}/${userId || 'anonymous'}/${uuid()}_${safeName}${extension}`;

    const uploadParams = {
      Bucket: bucket,
      Key: filename,
      Body: item.buffer,
      ContentType: item.mimetype,
    };

    const upload = new Upload({
      client: AwsClient.s3Instance,
      params: uploadParams
    });

    const response = await upload.done();

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error('File upload failed');
    }

    const signedUrl = await getSignedUrl(
      AwsClient.s3Instance,
      new GetObjectCommand({
        Bucket: bucket,
        Key: filename
      }),
      { expiresIn: 3600 }
    );

    uploadedFiles.push({
      guid: uuid(),
      key: filename,
      name: item.originalname,
      filename: item.originalname,
      mimetype: item.mimetype,
      size: item.size,
      url: signedUrl,
      publicUrl: signedUrl,
      uploadedAt: new Date(),
    });
  }

  return uploadedFiles;
};
