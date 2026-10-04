import { Router } from 'express';
import {
  getArticles,
  createArticle,
  getArticleBySlug,
  generateArticles,
  getArticleById,
} from '../controllers/article.controller';

import { isAdmin } from '../middleware/isAdmin';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', getArticles);

// Public read endpoints — this is a public, SEO-indexed blog and the article
// page fetches them without a session. The slug route previously required a
// token while the equivalent id route did not.
router.get('/slug/:slug', getArticleBySlug);
router.get('/id/:id', getArticleById);

// Login + Admin
router.post('/', verifyToken, isAdmin, createArticle);
router.post('/generate', verifyToken, isAdmin, generateArticles);

export default router;
