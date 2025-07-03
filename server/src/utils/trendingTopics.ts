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

function isValidTitle(title: any): boolean {
  if (!title || typeof title !== 'string') return false;

  const lower = title.trim().toLowerCase();
  return lower !== '' && lower !== 'true' && lower !== 'not found';
}

export const getGoogleTrends = async (): Promise<NewsItem[]> => {
  const results: NewsItem[] = [];

  for (const { name, code } of supportedCountries) {
    for (const category of categories) {
      const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=${code}&max=3&apikey=${GNEWS_API_KEY}`;
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=${code}&category=${category}&pageSize=3&apiKey=${NEWSAPI_KEY}`;

      try {
        const { data } = await axios.get(gnewsUrl);

        if (data.articles?.length > 0) {
          const formatted = data.articles
            .filter((article: any) => isValidTitle(article.title))
            .map((article: any) => ({
              title: article.title,
              description: article.description || '',
              country: name,
              code,
              category,
              source: 'GNews',
            }));

          results.push(...formatted);
          console.log(`✅ GNews: ${formatted.length} valid articles for ${name} (${category})`);
        } else {
          throw new Error('No GNews articles found');
        }
      } catch (gnewsErr: any) {
        console.warn(`⚠️ GNews failed for ${name} (${category}):`, gnewsErr.message);
        try {
          const { data } = await axios.get(newsApiUrl);

          if (data.articles?.length > 0) {
            const formatted = data.articles
              .filter((article: any) => isValidTitle(article.title))
              .map((article: any) => ({
                title: article.title,
                description: article.description || '',
                country: name,
                code,
                category,
                source: 'NewsAPI',
              }));

            results.push(...formatted);
            console.log(`✅ NewsAPI: ${formatted.length} valid articles for ${name} (${category})`);
          } else {
            throw new Error('No NewsAPI articles found');
          }
        } catch (newsApiErr: any) {
          console.error(`❌ Both APIs failed for ${name} (${category})`);
        }
      }

      await new Promise((res) => setTimeout(res, 1200));
    }
  }

  return results;
};
