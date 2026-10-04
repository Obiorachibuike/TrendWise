import mongoose from 'mongoose';

const MAX_ATTEMPTS = Number(process.env.DB_CONNECT_ATTEMPTS ?? 5);
const RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_MS ?? 3000);
/**
 * Bounds how long a single connect() may take. Mongoose defaults to 30s, so
 * five unbounded retries could stall the boot for ~2.5 minutes and trip the
 * platform's start-up timeout before it ever reported a failure.
 */
const SERVER_SELECTION_TIMEOUT_MS = Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS ?? 10_000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Connects to MongoDB with bounded retries.
 *
 * The previous version called process.exit(1) on the first failure. On a PaaS
 * the database is often reachable a second or two after the web process boots,
 * so one transient DNS/socket error took the service down and left it in a
 * restart loop instead of retrying.
 */
const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set. Cannot start.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
      console.log('✅ MongoDB connected');
      return;
    } catch (err: any) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err?.message ?? err}`
      );

      if (attempt === MAX_ATTEMPTS) {
        console.error('💀 Giving up — exiting so the platform restarts the process.');
        process.exit(1);
      }

      // Release the half-open connection so the next attempt starts clean;
      // without this mongoose can sit in server selection for its full timeout.
      await mongoose.disconnect().catch(() => undefined);
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDB;
