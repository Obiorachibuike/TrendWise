import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  meta: { title: string; description: string; ogImage: string };
  media: { images: string[]; tweets: string[]; videos: string[] };
  content: string;
  author: mongoose.Types.ObjectId;
  country?: string;   // 🌍 Country name (e.g. United States)
  code?: string;      // 🌐 Country code (e.g. us)
  category?: string;  // 🏷️ GNews category (e.g. business, health)
  source?: string;    // 📰 Optional: GNews, RSS, etc.
  createdAt?: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    meta: {
      title: String,
      description: String,
      ogImage: String,
    },
    media: {
      images: [String],
      tweets: [String],
      videos: [String],
    },
    content: { type: String, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    country: { type: String },
    code: { type: String },
    category: { type: String },  // ✅ GNews category
    source: { type: String, default: 'GNews' },  // ✅ Source
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
