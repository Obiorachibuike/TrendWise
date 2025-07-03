import { User } from '../models/User.model';

const ensureAdminUser = async (): Promise<string> => {
  const email = 'admin@trendwise.com';
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      name: 'Admin',
      email,
      image: 'https://i.pravatar.cc/150?img=admin'
    });
    await user.save();
    console.log('✅ Created admin user');
  }

  return user._id.toString();
};

const run = async () => {
  try {
    await connectDB();
    const adminUserId = await ensureAdminUser();
    const trends = await getGoogleTrends();

    for (const topic of trends) {
      const article = await generateArticleFromTopic(topic, adminUserId);
      console.log(`✅ Created: ${article.slug}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
};
