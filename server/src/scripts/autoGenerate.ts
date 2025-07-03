import dotenv from 'dotenv';
import connectDB from '../db/connect';
import { getGoogleTrends } from '../utils/trendingTopics';
import { generateArticleFromTopic } from '../utils/generateArticle';

dotenv.config();

const ADMIN_USER_ID = process.env.ADMIN_USER_ID as string;

const run = async () => {
  try {
    await connectDB();
    const trends = await getGoogleTrends();

    for (const topic of trends) {
      console.log(`🧠 Generating article for: ${topic}`);
      const article = await generateArticleFromTopic(topic, ADMIN_USER_ID);
      console.log(`✅ Created: ${article.slug}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
};

run();
