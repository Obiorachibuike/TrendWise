import { Article } from '../models/Article.model';
import { getGoogleTrends } from '../utils/trendingTopics';
import { generateArticleFromTopic } from '../utils/generateArticle';

/**
 * Core article jobs, shared by the HTTP handlers and the cron scheduler.
 *
 * index.ts used to call the Express controllers from cron with hand-rolled mock
 * req/res objects (`{ json: () => {}, status: () => ({ json: () => {} }) }`).
 * Any change to how the controller used `res` silently broke the scheduled job,
 * so the real work now lives here and the controllers are thin wrappers.
 */

export type GenerationResult = {
  topics: number;
  created: number;
  failed: number;
  slugs: string[];
  failures: string[];
};

export const generateArticlesFromTrends = async (): Promise<GenerationResult> => {
  const trends = await getGoogleTrends();

  const slugs: string[] = [];
  const failures: string[] = [];

  for (const topic of trends) {
    try {
      const article = await generateArticleFromTopic(topic);
      slugs.push(article.slug);
      console.log(`📝 Generated: ${article.slug}`);
    } catch (err: any) {
      failures.push(topic.title);
      console.error(`⚠️ Failed to generate article for "${topic.title}":`, err?.message ?? err);
    }
  }

  return { topics: trends.length, created: slugs.length, failed: failures.length, slugs, failures };
};

export type PurgeResult = { deletedCount: number; cutoff: Date };

export const purgeOldArticles = async (): Promise<PurgeResult> => {
  const configured = Number(process.env.ARTICLE_RETENTION_DAYS ?? 7);
  const days = Number.isFinite(configured) && configured > 0 ? configured : 7;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await Article.deleteMany({ createdAt: { $lt: cutoff } });
  return { deletedCount: result.deletedCount ?? 0, cutoff };
};
