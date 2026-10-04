import dotenv from 'dotenv';
import connectDB from '../db/connect';
import { getGoogleTrends } from '../utils/trendingTopics';
import { generateArticleFromTopic } from '../utils/generateArticle';

dotenv.config();

/**
 * Manual backfill script: `npx ts-node src/scripts/autoGenerate.ts`
 *
 * `generateArticleFromTopic` takes a single ArticleInput
 * ({ title, country, code, source }) — the NewsItems returned by
 * getGoogleTrends already satisfy that shape.
 */
const run = async () => {
  try {
    await connectDB();
    const trends = await getGoogleTrends();

    console.log(`🧠 ${trends.length} trending topics to process`);

    let created = 0;
    for (const topic of trends) {
      try {
        const article = await generateArticleFromTopic(topic);
        created++;
        console.log(`✅ Created: ${article.slug}`);
      } catch (err: any) {
        // One bad topic must not abort the whole backfill.
        console.error(`⚠️ Skipped "${topic.title}": ${err.message}`);
      }
    }

    console.log(`🏁 Done — ${created}/${trends.length} articles created`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
};

run();
