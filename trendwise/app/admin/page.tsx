'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_BASE_URL;

type Article = {
  _id: string;
  title: string;
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const fetchArticles = async () => {
    try {
      const res = await fetch(`${API}/articles`);
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError('Failed to fetch articles');
    }
  };

  const generateArticle = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      if (!res.ok) throw new Error('Failed to generate article');
      setTopic('');
      fetchArticles();
    } catch (err) {
      setError('Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (!session) return <p className="p-4">🔐 Please log in to access admin panel.</p>;

  if (session.user?.email !== ADMIN_EMAIL) {
    return <p className="p-4 text-red-600">⛔ You do not have admin access.</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

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
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">All Articles:</h3>
      <ul className="space-y-1 text-sm">
        {articles.map((a) => (
          <li key={a._id} className="border-b py-1">{a.title}</li>
        ))}
      </ul>
    </div>
  );
}
