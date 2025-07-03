import { create } from 'zustand';
const API = process.env.NEXT_PUBLIC_BASE_URL;

export type Article = {
  _id: string;
  title: string;
  description: string;
  country: string;
  code: string;
  category: string;
  source: string;
};

interface ArticleStore {
  articles: Article[];
  filtered: Article[];
  loading: boolean;
  error: string | null;

  fetchArticles: () => Promise<void>;
  searchArticles: (query: string) => void; // ✅ Renamed here
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
      const res = await fetch(`${API}/api/articles`);
      if (!res.ok) throw new Error('Failed to fetch articles');

      const data: Article[] = await res.json();
      set({ articles: data, filtered: data, loading: false });
    } catch (err: any) {
      console.error('❌ Failed to fetch articles:', err.message || err);
      set({
        error: 'Failed to load articles. Please try again later.',
        loading: false,
      });
    }
  },

  searchArticles: (query: string) => {
    const lower = query.toLowerCase();
    const filtered = get().articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower)
    );
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
