import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';
import connectDB from './db/connect';

import articleRoutes from './routes/article.routes';
import commentRoutes from './routes/comment.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';


import { generateArticles,deleteOldArticles } from './controllers/article.controller';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Connect to DB and start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`✅ Backend listening on port ${PORT}`);
  });

  // 🕒 Schedule article generation every 5 minutes
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('⏳ Running scheduled article generation...');
  //   try {
  //     await generateArticles(null as any, null as any); // nulls if generateArticles uses req/res
  //     console.log('✅ Article generation completed');
  //   } catch (err) {
  //     console.error('❌ Error in scheduled article generation:', err);
  //   }
  // });


// Keep reference to the task so we can stop it
let cronJob = cron.schedule('0 */6 * * *', async () => {
  console.log('⏳ Running scheduled article generation...');

  try {
    await generateArticles(
      {} as any,
      {
        json: () => {},
        status: () => ({ json: () => {} }),
      } as any
    );
    console.log('✅ Articles generated successfully');
  } catch (err: any) {
    console.error('❌ Error in scheduled article generation:', err.message);

    // Stop the job on 403 error
    if (err.response?.status === 403) {
      console.error('⛔️ Detected 403 Forbidden - stopping the cron job.');
      cronJob.stop();
    }
  }
});


// Call manually or wrap in a mock Request/Response if using directly
cron.schedule('0 1 * * *', async () => {
  console.log('🧹 Running cleanup: deleting old articles...');
  try {
    await deleteOldArticles(
      {} as any,
      {
        status: () => ({
          json: (data: any) => console.log('✅ Cleanup result:', data),
        }),
      } as any
    );
  } catch (err) {
    console.error('❌ Failed to delete old articles:', err);
  }
});

});
