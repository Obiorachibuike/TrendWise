'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Article = {
  _id: string;
  title: string;
  createdAt?: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [topic, setTopic] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const token = session?.user?.token;

  const fetchArticles = async (authToken?: string) => {
    try {
      const data = await apiFetch<Article[]>('/api/articles', { authToken });
      setArticles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fetch articles');
    }
  };

  /**
   * Was POST `${API}/articles` with `{ topic }`:
   *  - wrong prefix (the server mounts /api/articles) → 404
   *  - even at the right path it hit `createArticle`, whose schema requires
   *    `title` and `slug`, so `{ topic }` always failed validation
   *  - and it sent no Authorization header
   * It now targets the admin generate-topic endpoint with the backend JWT.
   */
  const generateArticle = async () => {
    if (!topic.trim() || !token) return;
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await apiFetch<{ article: Article }>('/api/admin/articles/generate-topic', {
        method: 'POST',
        authToken: token,
        body: JSON.stringify({ topic: topic.trim() }),
      });
      setNotice(`Generated “${res.article?.title ?? topic.trim()}”`);
      setTopic('');
      await fetchArticles(token);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === 'loading') return <p className="p-4">Loading…</p>;

  if (!session) return <p className="p-4">🔐 Please log in to access admin panel.</p>;

  if (session.user?.email !== ADMIN_EMAIL) {
    return <p className="p-4 text-red-600">⛔ You do not have admin access.</p>;
  }

  if (!token) {
    return (
      <p className="p-4 text-red-600">
        ⛔ Your session has no API token. Sign out and back in to continue.
      </p>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {notice && <p className="text-green-700 mb-4">{notice}</p>}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border p-2 w-full"
          placeholder="Enter a trending topic..."
        />
        <button
          onClick={generateArticle}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loading || !topic.trim()}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">All Articles ({articles.length}):</h3>
      <ul className="space-y-1 text-sm">
        {articles.map((a) => (
          <li key={a._id} className="border-b py-1">{a.title}</li>
        ))}
      </ul>
    </div>
  );
}
