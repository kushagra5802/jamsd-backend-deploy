const Issue = require('../models/Issue');
const { uploadToS3 } = require('../utils/uploadToS3');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.ACCESS_SECRET,
  },
});

// async function listIssues(query = {}) {
//   const filter = {};
//   if (query.published === 'true') filter.isPublished = true;
//   if (query.year) filter.year = Number(query.year);

//   const issues = await Issue.find(filter)
//     .populate({
//       path: 'articles',
//       match: { isPublished: true },
//       select: 'title authors articleType abstract keywords pdfUrl publishedAt pageRange downloads views',
//     })
//     .sort({ year: -1, volume: -1, issueNumber: -1 });

//   const data = issues.map((issue) => {
//     const obj = issue.toObject();
//     obj.articleCount = obj.articles?.length || 0;
//     return obj;
//   });

//   return { success: true, data, total: data.length };
// }


async function listIssues(query = {}) {
  const filter = {};

  if (query.published === "true") {
    filter.isPublished = true;
  }

  if (query.year) {
    filter.year = Number(query.year);
  }

  const issues = await Issue.find(filter)
    .populate({
      path: "articles",
      match: { isPublished: true },
      select:
        "title authors articleType abstract keywords pdfUrl pdfKey publishedAt pageRange downloads views",
    })
    .sort({ year: -1, volume: -1, issueNumber: -1 });

  // generate signed URLs
  const data = await Promise.all(
    issues.map(async (issue) => {
      const obj = issue.toObject();

      if (obj.articles?.length) {
        obj.articles = await Promise.all(
          obj.articles.map(async (article) => {
            if (article.pdfKey) {
              try {
                const params = {
                  Bucket: process.env.BUCKET,
                  Key: article.pdfKey,
                };

                const command = new GetObjectCommand(params);

                const signedUrl = await getSignedUrl(
                  s3Client,
                  command,
                  {
                    expiresIn: 60 * 60, // 1 hour
                  }
                );

                article.pdfUrl = signedUrl;
              } catch (err) {
                console.error(
                  `Error generating signed URL for article ${article._id}:`,
                  err.message
                );
              }
            }

            return article;
          })
        );
      }

      obj.articleCount = obj.articles?.length || 0;

      return obj;
    })
  );

  return {
    success: true,
    data,
    total: data.length,
  };
}

async function getIssue(id) {
  const issue = await Issue.findById(id).populate({
    path: 'articles',
    match: { isPublished: true },
    select: 'title authors articleType abstract keywords pdfUrl publishedAt pageRange downloads views',
  });
  if (!issue) {
    const error = new Error('Issue not found.');
    error.status = 404;
    throw error;
  }
  return { success: true, data: issue };
}

async function createIssue(body) {
  const volume = Number(body.volume);
  const issueNumber = Number(body.issueNumber);
  const year = Number(body.year);
  if (!volume || !issueNumber || !year) {
    const error = new Error('Volume, issue number, and year are required.');
    error.status = 400;
    throw error;
  }

  const issue = await Issue.create({
    volume,
    issueNumber,
    season: body.season,
    year,
    title: body.title,
    description: body.description,
    coverImageUrl: body.coverImageUrl,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    isPublished: body.isPublished === true || body.isPublished === 'true',
  });
  return { success: true, data: issue };
}

async function publishIssue(id) {
  const issue = await Issue.findById(id);
  if (!issue) {
    const error = new Error('Issue not found.');
    error.status = 404;
    throw error;
  }
  issue.isPublished = true;
  issue.publishedAt = issue.publishedAt || new Date();
  await issue.save();
  return { success: true, data: issue };
}

async function unpublishIssue(id) {
  const issue = await Issue.findById(id);
  if (!issue) {
    const error = new Error('Issue not found.');
    error.status = 404;
    throw error;
  }
  issue.isPublished = false;
  await issue.save();
  return { success: true, data: issue };
}

module.exports = {
  listIssues,
  getIssue,
  createIssue,
  publishIssue,
  unpublishIssue,
};
