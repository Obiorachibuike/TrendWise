import { Router } from 'express';
import { getComments, postComment } from '../controllers/comment.controller';
import { verifyToken } from '../middleware/auth'; // Adjust path if needed

const router = Router();

router.get('/:articleId', getComments);         // Public
router.post('/', verifyToken, postComment);     // Protected ✅

export default router;
