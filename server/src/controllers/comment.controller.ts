import { Request, Response } from 'express';
import { Comment } from '../models/Comment.model';

export const getComments = async (req: Request, res: Response) => {
  const comments = await Comment.find({ articleId: req.params.articleId });
  res.json(comments);
};

export const postComment = async (req: Request, res: Response) => {
  const comment = new Comment(req.body);
  await comment.save();
  res.status(201).json(comment);
};
