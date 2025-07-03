import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '5h' });
};

// Fetch all users (admin only)
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  console.log('📥 [GET] /api/users - Fetching all users');
  try {
    const users = await User.find();
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('❌ Failed to fetch users:', err);
    res.status(500).json({ error: 'Failed to fetch users', err });
  }
};

// Create user or return existing (Google login support)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, name, image } = req.body;

  console.log('📥 [POST] /api/users - Incoming user data:', req.body);

  if (!email) {
    console.warn('⚠️ Email is missing in the request');
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      console.log(`🆕 Creating new user with email: ${email}`);
      const role = email === 'obiorachibuike22@gmail.com' ? 'admin' : 'user';
      user = new User({ email, name, image, role });
      await user.save();
      console.log('✅ User created successfully');
    } else {
      console.log(`🔁 User already exists. Checking for updates...`);
      let updated = false;

      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (image && user.image !== image) {
        user.image = image;
        updated = true;
      }

      if (updated) {
        await user.save();
        console.log('🔧 User information updated');
      } else {
        console.log('✅ No changes detected in user data');
      }
    }

    const token = generateToken(user._id.toString(), user.email);
    console.log('🔐 JWT Token generated (first 30 chars):', token.slice(0, 30) + '...');

    res.status(200).json({ message: 'User processed', user, token });
  } catch (err) {
    console.error('❌ Error creating or updating user:', err);
    res.status(500).json({ error: 'Failed to create or fetch user', err });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  console.log(`📥 [GET] /api/users/${userId} - Fetching user by ID`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`❌ User with ID ${userId} not found`);
      res.status(404).json({ message: 'User not found' });
      return;
    }
    console.log(`✅ User found for ID ${userId}`);
    res.json(user);
  } catch (err) {
    console.error('❌ Failed to fetch user by ID:', err);
    res.status(500).json({ error: 'Failed to fetch user', err });
  }
};

// Get user by email (used by NextAuth signIn callback)
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;
  console.log('📥 [GET] /api/users/by-email - Email:', email);

  if (!email || typeof email !== 'string') {
    console.warn('⚠️ Email query is missing or invalid');
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.warn(`❌ No user found with email: ${email}`);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log(`✅ User found for email: ${email}`);
    res.json({ user });
  } catch (err) {
    console.error('❌ Failed to fetch user by email:', err);
    res.status(500).json({ error: 'Failed to fetch user by email', err });
  }
};
