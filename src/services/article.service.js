const Article = require('../models/Article');
const Issue = require('../models/Issue');
const Submission = require('../models/Submission');
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

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeKeywords(value) {
  const parsed = parseJson(value, value);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  return String(parsed || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function listArticles(query) {
  const filter = { isPublished: true };
  if (query.type) filter.articleType = query.type;
  if (query.issue) filter.issue = query.issue;
  if (query.q) filter.$text = { $search: query.q };

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const [data, total] = await Promise.all([
    Article.find(filter)
      .populate('issue', 'volume issueNumber season year title')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Article.countDocuments(filter),
  ]);

  return { success: true, data, total, page, limit };
}

// async function getArticle(id) {
//   const article = await Article.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
//     .populate('issue', 'volume issueNumber season year title')
//     .populate('submission', 'submissionId');
//   if (!article || !article.isPublished) {
//     const error = new Error('Article not found.');
//     error.status = 404;
//     throw error;
//   }
//   console.log("article",article)
//   return { success: true, data: article };
// }

async function getArticle(id) {
  const article = await Article.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate("issue", "volume issueNumber season year title")
    .populate("submission", "submissionId");

  if (!article || !article.isPublished) {
    const error = new Error("Article not found.");
    error.status = 404;
    throw error;
  }

  // Generate signed URL from pdfKey
  if (article.pdfKey) {
    try {
      const params = {
        Bucket: process.env.BUCKET,
        Key: article.pdfKey,
      };

      const command = new GetObjectCommand(params);

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60, // 1 hour
      });
      conosle.log("PDF signedUrl",signedUrl)
      // replace old pdfUrl with fresh signed URL
      article.pdfUrl = signedUrl;
    } catch (err) {
      console.error("Error generating signed URL:", err.message);
    }
  }

  // Generate signed URL from imageKey
  if (article.imageKey) {
    try {
      const signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: process.env.BUCKET, Key: article.imageKey }),
        { expiresIn: 60 * 60 }
      );
      conosle.log("Image signedUrl",signedUrl)
      article.imageUrl = signedUrl;
    } catch (err) {
      console.error("Error generating signed image URL:", err.message);
    }
  }

  return {
    success: true,
    data: article,
  };
}

async function createArticle({ body, files, user }) {
  let seed = {};
  if (body.submission) {
    const submission = await Submission.findById(body.submission);
    if (!submission) {
      const error = new Error('Submission not found.');
      error.status = 404;
      throw error;
    }
    if (submission.status !== 'accepted') {
      const error = new Error('Only accepted submissions can be published.');
      error.status = 400;
      throw error;
    }
    seed = {
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      articleType: submission.articleType,
      authors: submission.authors,
      pdfUrl: submission.manuscriptFile?.url || submission.manuscriptFile?.publicUrl,
      pdfKey: submission.manuscriptFile?.key,
    };
  }

  const uploaded = await uploadToS3({
    files: files?.pdf || [],
    userId: user._id,
    folder: 'jamsd/articles',
  });
  const pdf = uploaded[0];

  const article = await Article.create({
    ...seed,
    title: body.title || seed.title,
    abstract: body.abstract || seed.abstract,
    keywords: body.keywords !== undefined ? normalizeKeywords(body.keywords) : seed.keywords,
    articleType: body.articleType || seed.articleType,
    authors: body.authors !== undefined ? parseJson(body.authors, []) : seed.authors,
    doi: body.doi,
    issue: body.issue,
    submission: body.submission,
    volume: body.volume,
    issueNumber: body.issueNumber,
    pageRange: body.pageRange,
    publishedAt: body.publicationDate ? new Date(body.publicationDate) : new Date(),
    aheadOfPrint: body.aheadOfPrint === 'true' || body.aheadOfPrint === true,
    pdfUrl: pdf?.url || pdf?.publicUrl || body.pdfUrl || seed.pdfUrl,
    pdfKey: pdf?.key || seed.pdfKey,
    isPublished: body.isPublished === undefined ? true : body.isPublished === true || body.isPublished === 'true',
  });

  if (article.issue) {
    await Issue.findByIdAndUpdate(article.issue, { $addToSet: { articles: article._id } });
  }

  return { success: true, data: article };
}

async function updateArticle({ id, body, files, user }) {
  const article = await Article.findById(id);
  if (!article) {
    const error = new Error('Article not found.');
    error.status = 404;
    throw error;
  }

  const uploaded = await uploadToS3({
    files: files?.pdf || [],
    userId: user._id,
    folder: 'jamsd/articles',
  });
  const pdf = uploaded[0];

  ['title', 'abstract', 'articleType', 'doi', 'issue', 'volume', 'issueNumber', 'pageRange', 'pdfUrl'].forEach((field) => {
    if (body[field] !== undefined) article[field] = body[field];
  });
  if (body.keywords !== undefined) article.keywords = normalizeKeywords(body.keywords);
  if (body.authors !== undefined) article.authors = parseJson(body.authors, article.authors);
  if (body.publicationDate !== undefined) article.publishedAt = new Date(body.publicationDate);
  if (body.aheadOfPrint !== undefined) article.aheadOfPrint = body.aheadOfPrint === true || body.aheadOfPrint === 'true';
  if (body.isPublished !== undefined) article.isPublished = body.isPublished === true || body.isPublished === 'true';
  if (pdf) {
    article.pdfUrl = pdf.url || pdf.publicUrl;
    article.pdfKey = pdf.key;
  }

  await article.save();
  if (article.issue) {
    await Issue.findByIdAndUpdate(article.issue, { $addToSet: { articles: article._id } });
  }
  return { success: true, data: article };
}

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
};
