import { GoogleGenAI, Modality } from '@google/genai';
import { Article } from '../models/Article.model';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

dotenv.config();

// Init Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const extractMedia = (content: string) => {
  const imageRegex = /<img[^>]+src="([^">]+)"/g;
  const tweetRegex = /https:\/\/twitter\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+/g;

  const images: string[] = [];
  const tweets: string[] = [];

  let match;
  while ((match = imageRegex.exec(content)) !== null) images.push(match[1]);
  while ((match = tweetRegex.exec(content)) !== null) tweets.push(match[0]);

  return { images, tweets };
};

const uploadImageToCloudinary = async (base64: string, slug: string): Promise<string> => {
  const buffer = Buffer.from(base64, 'base64');
  const tmpPath = path.join(__dirname, `temp-${slug}.png`);
  await writeFile(tmpPath, buffer);

  const result = await cloudinary.v2.uploader.upload(tmpPath, {
    folder: 'trendwise/articles',
    public_id: slug,
    transformation: [
      { width: 1024, height: 512, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  fs.unlinkSync(tmpPath);
  return result.secure_url;
};
export type ArticleInput = {
  title: string;
  country: string;
  code: string;
  source: string;
};
export const generateArticleFromTopic = async (input: ArticleInput) => {
  const { title, country, code, source } = input;
  const slug = slugify(title);

  const existing = await Article.findOne({ slug });
  if (existing) {
    console.warn(`⚠️ Article already exists for slug: ${slug}`);
    return existing;
  }

  // Step 1: Generate blog post content
  const contentPrompt = `
Generate a rich HTML blog post about "${title}" with:

- H1 Title
- 2 H2 subheadings
- SEO meta title and meta description
- OG image suggestion (describe what fits the post)
- At least 1 real embedded tweet (<blockquote>)
- Output as valid HTML (NO YouTube embed)
`;

  const contentResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: [{ role: 'user', parts: [{ text: contentPrompt }] }],
  });

  const content = contentResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const { images, tweets } = extractMedia(content);

  // Step 2: Generate OG image
  const imagePrompt = `Create an image that best represents the topic: "${title}" for use in a blog. No text, high quality.`;

  const imageResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: [imagePrompt],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let base64Image = '';
  const parts = imageResponse.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  // Step 3: Upload OG image
  let ogImage: string;
  if (base64Image) {
    ogImage = await uploadImageToCloudinary(base64Image, slug);
  } else {
    ogImage = images[0] || `https://source.unsplash.com/random/800x400/?${encodeURIComponent(title)}`;
  }

  // Step 4: Save article to MongoDB
  const article = new Article({
    title,
    slug,
    meta: {
      title: `${title} | TrendWise`,
      description: `A blog post about ${title}`,
      ogImage,
    },
    media: {
      images: ogImage ? [ogImage] : [],
      tweets,
      videos: [],
    },
    content,
    country,
    code,
    source: source || 'NewsAPI',
  });

  await article.save();
  return article;
};