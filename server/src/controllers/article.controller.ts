import { Request, Response } from 'express';
import { Article } from '../models/Article.model';
import { getGoogleTrends } from '../utils/trendingTopics';
import { generateArticleFromTopic } from '../utils/generateArticle';


// GET /articles
export const getArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });

    if (articles.length === 0) {
      console.warn('⚠️ No articles found in the database.');
    }

    res.json(articles);
  } catch (err) {
    console.error('❌ Failed to fetch articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles', err });
  }
};

// POST /articles
export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    console.error('❌ Error creating article:', error);
    res.status(500).json({ message: 'Failed to create article' });
  }
};

// GET /articles/slug/:slug
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



export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);

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



// ✅ Define types at the top
export type NewsItem = {
  title: string;
  country: string;
  code: string;
};

export type ArticleInput = {
  title: string;
  country: string;
  code: string;
  source: string;
};

// POST /articles/generate
export const generateArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const trends: NewsItem[] = await getGoogleTrends();

    if (!trends || trends.length === 0) {
      console.warn('⚠️ No trending topics returned');
      res.status(500).json({ message: 'No trends available to generate articles' });
      return;
    }

    const createdSlugs: string[] = [];

    for (const topic of trends) {
      console.log(`📰 Topic: ${topic.title} | Country: ${topic.country} (${topic.code})`);

      const input: ArticleInput = {
        title: topic.title,
        country: topic.country,
        code: topic.code,
        source: 'NewsAPI',
      };

//       try {
//      const article = await generateArticleFromTopic(input);
//  // accepts ArticleInput now
//         createdSlugs.push(article.slug);
//       } catch (genErr) {
//         console.error(`⚠️ Failed to generate article for t  opic "${topic.title}":`, genErr);
//       }
    }

    res.status(200).json({
      message: 'Generated articles from trending topics',
      slugs: createdSlugs,
    });
  } catch (error) {
    console.error('❌ Error generating articles from trends:', error);
    res.status(500).json({ message: 'Failed to generate trending articles' });
  }
};


export const deleteOldArticles = async (req: Request, res: Response) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await Article.deleteMany({
      createdAt: { $lt: oneWeekAgo },
    });

    res.status(200).json({
      message: 'Old articles deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting old articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

