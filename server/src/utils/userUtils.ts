import { User } from '../models/User.model';
import { DefaultSession } from 'next-auth';

export async function createOrUpdateUser(session: DefaultSession['user']) {
  if (!session?.email) return;
  const [user] = await User.findOneAndUpdate(
    { email: session.email },
    { name: session.name, image: session.image },
    { upsert: true, new: true }
  );
  return user;
}
