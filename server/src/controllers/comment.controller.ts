import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment.model';

/**
 * GET /api/comments/:articleId
 *
 * Previously had no try/catch. A malformed `articleId` made Mongoose throw a
 * CastError inside an async handler; Express 4 does not forward rejected
 * promises, so the request hung forever and the rejection became an
 * unhandledRejection — which terminates the Node process by default.
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
  const { articleId } = req.params;

  if (!mongoose.isValidObjectId(articleId)) {
    res.status(400).json({ error: 'Invalid article id' });
    return;
  }

  try {
    const comments = await Comment.find({ articleId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email image');

    res.json(comments);
  } catch (err) {
    console.error('❌ Failed to fetch comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

/**
 * POST /api/comments
 *
 * The author is taken from the verified JWT, never from the request body —
 * otherwise any signed-in user could post as someone else. The old client sent
 * `userName`/`userEmail` and no `userId`, which failed the schema's required
 * `userId` and produced exactly the unhandled rejection described above.
 */
export const postComment = async (req: Request, res: Response): Promise<void> => {
  const { articleId, content } = req.body ?? {};
  const userId = req.user?.userId ?? req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'You must be signed in to comment' });
    return;
  }

  if (!articleId || !mongoose.isValidObjectId(articleId)) {
    res.status(400).json({ error: 'A valid articleId is required' });
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  try {
    const comment = await Comment.create({
      articleId,
      userId,
      content: content.trim().slice(0, 5000),
    });

    const populated = await comment.populate('userId', 'name email image');
    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ Failed to create comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
