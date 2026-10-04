import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';
import connectDB from './db/connect';

import articleRoutes from './routes/article.routes';
import commentRoutes from './routes/comment.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';

import { generateArticlesFromTrends, purgeOldArticles } from './services/articleService';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Liveness probe for the platform (Render/Heroku health checks).
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Unknown routes get JSON instead of Express' HTML 404 page, so API clients
// can tell "wrong path" apart from "server down".
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Last-resort error handler.
 *
 * Express 4 does NOT forward a rejected promise from an async handler here, so
 * this only catches synchronous throws and errors passed to next(). Every async
 * handler must have its own try/catch — see comment.controller.ts, which used to
 * hang the socket and emit an unhandledRejection (fatal on Node >= 15) instead.
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Unhandled error:', err?.message ?? err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error' });
});

// Anything that still escapes should be logged loudly, not kill the process silently.
process.on('unhandledRejection', (reason) => {
  console.error('💥 unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 uncaughtException:', err);
});

export { app };

// Connect to DB and start server
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`✅ Backend listening on port ${PORT}`);
  });

  // 🕒 Generate articles from trends every 6 hours.
  // Calls the service directly — the old version invoked the Express controller
  // with a fake res object, which swallowed the result and broke silently.
  const generationJob = cron.schedule('0 */6 * * *', async () => {
    console.log('⏳ Running scheduled article generation...');
    try {
      const result = await generateArticlesFromTrends();
      console.log(
        `✅ Article generation completed — ${result.created}/${result.topics} created, ${result.failed} failed`
      );
    } catch (err: any) {
      console.error('❌ Error in scheduled article generation:', err?.message ?? err);

      // News providers rate-limit; back the job off rather than hammering them.
      if (err?.response?.status === 403 || err?.response?.status === 429) {
        console.error('⛔️ Rate limited (403/429) — stopping the generation job until restart.');
        generationJob.stop();
      }
    }
  });

  // 🧹 Purge articles past the retention window every day at 01:00.
  cron.schedule('0 1 * * *', async () => {
    console.log('🧹 Running cleanup: deleting old articles...');
    try {
      const { deletedCount, cutoff } = await purgeOldArticles();
      console.log(`✅ Cleanup result: ${deletedCount} deleted (older than ${cutoff.toISOString()})`);
    } catch (err: any) {
      console.error('❌ Failed to delete old articles:', err?.message ?? err);
    }
  });

  // Graceful shutdown so in-flight requests and the Mongo pool close cleanly.
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down.`);
    generationJob.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
});
