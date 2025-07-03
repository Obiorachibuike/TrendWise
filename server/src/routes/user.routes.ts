import { Router } from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  getUserByEmail,
} from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/', getUserByEmail); // Change this or separate if needed
router.get('/all', verifyToken, isAdmin, getUsers); // Separate admin route
router.get('/:id', verifyToken, getUserById);
router.post('/', createUser);

export default router;
