import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt?: Date; // ✅ Add this to match schema
}

const CommentSchema = new Schema<IComment>({
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
