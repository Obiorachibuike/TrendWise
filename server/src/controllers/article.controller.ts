import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Article } from '../models/Article.model';
import { generateArticleFromTopic } from '../utils/generateArticle';
import { generateArticlesFromTrends, purgeOldArticles } from '../services/articleService';

// Re-exported so existing importers of these types keep working, but there is
// now exactly one definition (in utils/generateArticle.ts).
export type { ArticleInput } from '../utils/generateArticle';

// GET /api/articles
export const getArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });

    if (articles.length === 0) {
      console.warn('⚠️ No articles found in the database.');
    }

    res.json(articles);
  } catch (err) {
    console.error('❌ Failed to fetch articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

// POST /api/articles
export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (error: any) {
    console.error('❌ Error creating article:', error.message ?? error);
    res.status(400).json({ message: 'Failed to create article', error: error.message });
  }
};

// GET /api/articles/slug/:slug
export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json(article);
  } catch (error) {
    console.error('❌ Error fetching article by slug:', error);
    res.status(500).json({ message: 'Failed to fetch article' });
  }
};

// GET /api/articles/id/:id
export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // An invalid id used to reach findById() and surface as a 500 CastError.
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid article id' });
    return;
  }

  try {
    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json(article);
  } catch (error) {
    console.error('❌ Error fetching article by id:', error);
    res.status(500).json({ message: 'Failed to fetch article' });
  }
};

/**
 * POST /api/articles/generate  (and /api/admin/articles/generate)
 *
 * The call to generateArticleFromTopic used to be commented out, so this handler
 * — and the 6-hourly cron in index.ts that drives it — fetched trends, logged
 * them, saved nothing, and still reported 200 "Generated articles from trending
 * topics". Combined with the nightly 7-day purge that meant the site slowly
 * emptied itself and never refilled.
 */
export const generateArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await generateArticlesFromTrends();

    if (result.topics === 0) {
      console.warn('⚠️ No trending topics returned');
      res.status(500).json({ message: 'No trends available to generate articles' });
      return;
    }

    res.status(200).json({ message: 'Generated articles from trending topics', ...result });
  } catch (error: any) {
    console.error('❌ Error generating articles from trends:', error.message ?? error);
    res.status(500).json({ message: 'Failed to generate trending articles' });
  }
};

/**
 * POST /api/admin/articles/generate-topic
 * Backs the "topic" box in the admin dashboard.
 */
export const generateArticleByTopic = async (req: Request, res: Response): Promise<void> => {
  const { topic, country = 'United States', code = 'us', source = 'Admin' } = req.body ?? {};

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    res.status(400).json({ message: 'A topic is required' });
    return;
  }

  try {
    const article = await generateArticleFromTopic({
      title: topic.trim(),
      country,
      code,
      source,
    });

    res.status(201).json({ message: 'Article generated', article });
  } catch (error: any) {
    console.error(`❌ Failed to generate article for "${topic}":`, error.message ?? error);
    res.status(500).json({ message: 'Failed to generate article' });
  }
};

/**
 * Deletes articles older than ARTICLE_RETENTION_DAYS (default 7).
 * Runs nightly from index.ts.
 */
export const deleteOldArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { deletedCount, cutoff } = await purgeOldArticles();

    console.log(`🧹 Purged ${deletedCount} article(s) older than ${cutoff.toISOString()}`);

    res.status(200).json({
      message: 'Old articles deleted successfully',
      deletedCount,
      cutoff,
    });
  } catch (error) {
    console.error('❌ Error deleting old articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
