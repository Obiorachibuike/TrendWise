import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: 'user' | 'admin';
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: { type: String, unique: true },
  image: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

export const User = mongoose.model<IUser>('User', UserSchema);
