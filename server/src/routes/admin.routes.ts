import { Router } from 'express';
import { generateArticles } from '../controllers/article.controller';
import { verifyToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

/**
 * POST /admin/articles/generate
 * Generates articles from Google Trends (Admin-only)
 */
router.post('/articles/generate', verifyToken, isAdmin, generateArticles);

export default router;
