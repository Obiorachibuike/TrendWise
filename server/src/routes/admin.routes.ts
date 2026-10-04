import { Router } from 'express';
import {
  generateArticles,
  generateArticleByTopic,
} from '../controllers/article.controller';
import { verifyToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

/**
 * POST /api/admin/articles/generate
 * Generates articles from trending topics (Admin-only)
 */
router.post('/articles/generate', verifyToken, isAdmin, generateArticles);

/**
 * POST /api/admin/articles/generate-topic
 * Generates a single article for an explicit topic (Admin-only).
 * This is what the admin dashboard's "topic" box calls.
 */
router.post('/articles/generate-topic', verifyToken, isAdmin, generateArticleByTopic);

export default router;
