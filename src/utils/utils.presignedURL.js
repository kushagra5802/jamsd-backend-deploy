const { GetObjectCommand, S3Client } =  require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { HttpRequest } = require("@aws-sdk/protocol-http");
const {
  getSignedUrl,
  S3RequestPresigner,
} = require("@aws-sdk/s3-request-presigner");
const { parseUrl } = require("@aws-sdk/url-parser");
const { formatUrl } = require("@aws-sdk/util-format-url");
const { Hash } = require("@aws-sdk/hash-node");
const Responses = require("../utils/utils.response");


const createPresignedUrlWithoutClient = async ({ region, bucket, key }) => {
  const url = parseUrl(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
  const presigner = new S3RequestPresigner({
    credentials: fromIni(
      // {

      // // Optional. The configuration profile to use. If not specified, the provider will use the value
      // // in the `AWS_PROFILE` environment variable or a default of `default`.
      // profile: "default",
      // // Optional. The path to the shared credentials file. If not specified, the provider will use
      // // the value in the `AWS_SHARED_CREDENTIALS_FILE` environment variable or a default of
      // // `~/.aws/credentials`.
      // filepath: "~/.aws/credentials",
      // // Optional. The path to the shared config file. If not specified, the provider will use the
      // // value in the `AWS_CONFIG_FILE` environment variable or a default of `~/.aws/config`.
      // configFilepath: "~/.aws/config",
      // // Optional. A function that returns a a promise fulfilled with an MFA token code for the
      // // provided MFA Serial code. If a profile requires an MFA code and `mfaCodeProvider` is not a
      // // valid function, the credential provider promise will be rejected.
      // mfaCodeProvider: async (mfaSerial) => {
      //   return "token";
      // },
      // // Optional. Custom STS client configurations overriding the default ones.
      // clientConfig: { region },
    // }
    ),
    region,
    sha256: Hash.bind(null, "sha256"),
  }
  );

  const signedUrlObject = await presigner.presign(new HttpRequest(url));
  // console.log("signedUrlObject ----------- ", signedUrlObject);
  return formatUrl(signedUrlObject);
};

const createPresignedUrlWithClient = async ({ region, bucket, key }) => {
  const client = new S3Client({ region });
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

module.exports = async (filename) => {
  const REGION = process.env.REGION;
  const BUCKET = process.env.BUCKET;
  const KEY = filename;

  try {
    const noClientUrl = await createPresignedUrlWithoutClient({
      region: REGION,
      bucket: BUCKET,
      key: KEY,
    });

    const clientUrl = await createPresignedUrlWithClient({
      region: REGION,
      bucket: BUCKET,
      key: KEY,
    });

    // console.log("Presigned URL without client");
    // console.log(noClientUrl);
    // console.log("\n");

    // console.log("Presigned URL with client");
    // console.log(clientUrl);
    return clientUrl;
  } catch (err) {
    return res.status(400).json(Responses.errorResponse(err))
  }
};
