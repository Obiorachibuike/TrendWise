import cron from 'node-cron';
import { getGoogleTrends } from './utils/trendingTopics';
import { generateArticleFromTopic } from './utils/generateArticle';
import connectDB from './db/connect';
import dotenv from 'dotenv';

dotenv.config();

const userId = process.env.ADMIN_USER_ID || '';

cron.schedule('0 8 * * *', async () => {
  console.log('🔁 Running scheduled article generator...');
  await connectDB();
  const trends = await getGoogleTrends();

  for (const topic of trends) {
    await generateArticleFromTopic(topic, userId);
    console.log(`📝 Generated: ${topic}`);
  }
});
