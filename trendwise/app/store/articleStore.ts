import { create } from 'zustand';
import { apiUrl } from '../lib/api';

/**
 * Mirrors the server's Article document (server/src/models/Article.model.ts).
 *
 * This used to declare a top-level `description`, which the API never returns —
 * the description lives at `meta.description`. `searchArticles` called
 * `a.description.toLowerCase()`, so every search threw a TypeError and blanked
 * the page.
 */
export type Article = {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  meta?: { title?: string; description?: string; ogImage?: string };
  media?: { images?: string[]; tweets?: string[]; videos?: string[] };
  country?: string;
  code?: string;
  category?: string;
  source?: string;
  createdAt?: string;
};

interface ArticleStore {
  articles: Article[];
  filtered: Article[];
  loading: boolean;
  error: string | null;

  fetchArticles: () => Promise<void>;
  searchArticles: (query: string) => void;
  filter: (params: { category?: string; country?: string; source?: string }) => void;
  reset: () => void;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  articles: [],
  filtered: [],
  loading: false,
  error: null,

  fetchArticles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(apiUrl('/api/articles'));
      if (!res.ok) throw new Error('Failed to fetch articles');

      const data: Article[] = await res.json();
      const articles = Array.isArray(data) ? data : [];
      set({ articles, filtered: articles, loading: false });
    } catch (err: any) {
      console.error('❌ Failed to fetch articles:', err.message || err);
      set({
        error: err?.message?.includes('NEXT_PUBLIC_BASE_URL')
          ? err.message
          : 'Failed to load articles. Please try again later.',
        loading: false,
      });
    }
  },

  searchArticles: (query: string) => {
    const lower = query.toLowerCase();
    const filtered = get().articles.filter((a) => {
      const title = a.title ?? '';
      const description = a.meta?.description ?? '';
      return (
        title.toLowerCase().includes(lower) || description.toLowerCase().includes(lower)
      );
    });
    set({ filtered });
  },

  filter: ({ category, country, source }) => {
    const all = get().articles;
    const filtered = all.filter((a) => {
      return (
        (!category || a.category === category) &&
        (!country || a.code === country) &&
        (!source || a.source === source)
      );
    });
    set({ filtered });
  },

  reset: () => set({ filtered: get().articles }),
}));
