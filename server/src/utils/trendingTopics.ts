import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GNEWS_API_KEY = process.env.GNEWS_API_KEY!;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY!;

export const supportedCountries: { name: string; code: string }[] = [
  { name: 'Australia', code: 'au' },
  { name: 'Brazil', code: 'br' },
  { name: 'Canada', code: 'ca' },
  { name: 'China', code: 'cn' },
  { name: 'Egypt', code: 'eg' },
  { name: 'France', code: 'fr' },
  { name: 'Germany', code: 'de' },
  { name: 'Greece', code: 'gr' },
  { name: 'Hong Kong', code: 'hk' },
  { name: 'India', code: 'in' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Italy', code: 'it' },
  { name: 'Japan', code: 'jp' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'Norway', code: 'no' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Peru', code: 'pe' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Romania', code: 'ro' },
  { name: 'Russian Federation', code: 'ru' },
  { name: 'Singapore', code: 'sg' },
  { name: 'Spain', code: 'es' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
];

const categories = [
  'general',
  'world',
  'nation',
  'business',
  'technology',
  'entertainment',
  'sports',
  'science',
  'health',
];

type NewsItem = {
  title: string;
  description: string;
  country: string;
  code: string;
  category: string;
  source: string;
};

/**
 * This loop used to iterate EVERY country (29) x EVERY category (9) = 261
 * upstream requests per run, and the cron runs 4x a day — ~1044 requests/day
 * against free tiers that allow 100 (GNews) to 500 (NewsAPI). The daily quota
 * was exhausted within the first run, every later call returned 403, and the
 * cron's "Detected 403 Forbidden - stopping the cron job" branch was the
 * symptom. Defaults are now small and overridable via env.
 */
const parseList = (raw: string | undefined, fallback: string[]): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase()) ?? fallback;

const enabledCodes = (() => {
  const requested = parseList(process.env.TRENDS_COUNTRIES, ['us', 'gb', 'in']);
  return supportedCountries.filter(({ code }) => requested.includes(code));
})();

const enabledCategories = (() => {
  const requested = parseList(process.env.TRENDS_CATEGORIES, ['general', 'technology', 'business']);
  return categories.filter((c) => requested.includes(c));
})();

const MAX_PER_QUERY = Number(process.env.TRENDS_MAX_PER_QUERY ?? 3);
const REQUEST_GAP_MS = Number(process.env.TRENDS_REQUEST_GAP_MS ?? 1200);
const MAX_RESULTS = Number(process.env.TRENDS_MAX_RESULTS ?? 40);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isQuotaError = (status?: number) => status === 401 || status === 402 || status === 403 || status === 429;

function isValidTitle(title: any): boolean {
  if (!title || typeof title !== 'string') return false;

  const lower = title.trim().toLowerCase();
  return lower !== '' && lower !== 'true' && lower !== 'not found';
}

export const getGoogleTrends = async (): Promise<NewsItem[]> => {
  const results: NewsItem[] = [];
  const seen = new Set<string>();

  // Once a provider rejects us for auth/quota reasons, stop spending its
  // remaining budget for this run instead of repeating a doomed call 261 times.
  let gnewsDisabled = !GNEWS_API_KEY;
  let newsapiDisabled = !NEWSAPI_KEY;

  if (gnewsDisabled) console.warn('⚠️ GNEWS_API_KEY not set — skipping GNews');
  if (newsapiDisabled) console.warn('⚠️ NEWSAPI_KEY not set — skipping NewsAPI');

  const push = (items: NewsItem[]) => {
    for (const item of items) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(item);
      if (results.length >= MAX_RESULTS) return;
    }
  };

  outer: for (const { name, code } of enabledCodes) {
    for (const category of enabledCategories) {
      if (results.length >= MAX_RESULTS) break outer;
      if (gnewsDisabled && newsapiDisabled) {
        console.warn('⚠️ Both news providers are unavailable — stopping early.');
        break outer;
      }

      if (!gnewsDisabled) {
        try {
          const { data } = await axios.get(
            `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=${code}&max=${MAX_PER_QUERY}&apikey=${GNEWS_API_KEY}`
          );

          if (data.articles?.length > 0) {
            const formatted: NewsItem[] = data.articles
              .filter((a: any) => isValidTitle(a.title))
              .map((a: any) => ({
                title: a.title,
                description: a.description || '',
                country: name,
                code,
                category,
                source: 'GNews',
              }));

            push(formatted);
            console.log(`✅ GNews: ${formatted.length} valid articles for ${name} (${category})`);
          } else {
            console.warn(`⚠️ GNews returned nothing for ${name} (${category})`);
          }
        } catch (gnewsErr: any) {
          const status = gnewsErr?.response?.status;
          if (isQuotaError(status)) {
            console.error(`⛔️ GNews returned ${status} (auth/quota) — disabling GNews for this run.`);
            gnewsDisabled = true;
          } else {
            console.warn(`⚠️ GNews failed for ${name} (${category}): ${gnewsErr?.message}`);
          }
        }
      }

      // Only fall back to NewsAPI when GNews didn't produce anything for this slot.
      const gotFromGNews = results.some((r) => r.code === code && r.category === category);
      if (!gotFromGNews && !newsapiDisabled) {
        try {
          const { data } = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=${code}&category=${category}&pageSize=${MAX_PER_QUERY}&apiKey=${NEWSAPI_KEY}`
          );

          if (data.articles?.length > 0) {
            const formatted: NewsItem[] = data.articles
              .filter((a: any) => isValidTitle(a.title))
              .map((a: any) => ({
                title: a.title,
                description: a.description || '',
                country: name,
                code,
                category,
                source: 'NewsAPI',
              }));

            push(formatted);
            console.log(`✅ NewsAPI: ${formatted.length} valid articles for ${name} (${category})`);
          } else {
            console.warn(`⚠️ NewsAPI returned nothing for ${name} (${category})`);
          }
        } catch (newsApiErr: any) {
          const status = newsApiErr?.response?.status;
          if (isQuotaError(status)) {
            console.error(`⛔️ NewsAPI returned ${status} (auth/quota) — disabling NewsAPI for this run.`);
            newsapiDisabled = true;
          } else {
            console.error(`❌ NewsAPI failed for ${name} (${category}): ${newsApiErr?.message}`);
          }
        }
      }

      await sleep(REQUEST_GAP_MS);
    }
  }

  console.log(`📊 Trend scan finished with ${results.length} topics`);
  return results;
};
