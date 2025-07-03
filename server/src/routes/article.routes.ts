import { Router } from 'express';
import {
  getArticles,
  createArticle,
  getArticleBySlug,
  generateArticles,
  getArticleById
} from '../controllers/article.controller';

import { isAdmin } from '../middleware/isAdmin';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', getArticles);
router.get('/slug/:slug', verifyToken, getArticleBySlug); // ✅ Protected
router.get('/id/:id', getArticleById); // ✅ Protected
router.post('/', createArticle);
router.post('/generate', verifyToken, isAdmin, generateArticles); // ✅ Login + Admin

export default router;
