import { GoogleGenAI, Modality } from '@google/genai';
import { Article } from '../models/Article.model';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const CONTENT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-001';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 120);

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

/**
 * Streams the buffer straight to Cloudinary.
 *
 * The previous version wrote a `temp-<slug>.png` into `__dirname` and then
 * `fs.unlinkSync`'d it. On a read-only container filesystem that write throws,
 * and if the upload rejected the unlink never ran so temp files piled up.
 */
const uploadImageToCloudinary = (buffer: Buffer, slug: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'trendwise/articles',
        public_id: slug,
        overwrite: true,
        transformation: [
          { width: 1024, height: 512, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Cloudinary returned no secure_url'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

export type ArticleInput = {
  title: string;
  country: string;
  code: string;
  source: string;
  /** News category (business, technology, …) — drives the header's filter. */
  category?: string;
};

export const generateArticleFromTopic = async (input: ArticleInput) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set — cannot generate article content');
  }

  const { title, country, code, source, category } = input;
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
    model: CONTENT_MODEL,
    contents: [{ role: 'user', parts: [{ text: contentPrompt }] }],
  });

  const content = contentResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!content.trim()) {
    throw new Error(`Model ${CONTENT_MODEL} returned empty content for "${title}"`);
  }

  const { images, tweets } = extractMedia(content);

  // Step 2: Generate OG image. A missing image is not fatal — fall back below.
  let base64Image = '';
  try {
    const imageResponse = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        `Create an image that best represents the topic: "${title}" for use in a blog. No text, high quality.`,
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = imageResponse.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ Image generation failed for "${title}", falling back: ${err?.message ?? err}`);
  }

  // Step 3: Resolve the OG image
  let ogImage = images[0] || '';
  if (base64Image) {
    try {
      ogImage = await uploadImageToCloudinary(Buffer.from(base64Image, 'base64'), slug);
    } catch (err: any) {
      console.warn(`⚠️ Cloudinary upload failed for "${slug}": ${err?.message ?? err}`);
    }
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
    category,
    source: source || 'NewsAPI',
    // The admin user owns generated content; leaving this unset made every
    // article render as "Anonymous" on the article page.
    author: process.env.ADMIN_USER_ID || undefined,
  });

  await article.save();
  return article;
};
