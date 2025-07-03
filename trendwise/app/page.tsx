'use client';

import { useEffect } from 'react';
import ArticleCard from './components/ArticleCard';
import Header from './components/Header';
import Footer from './components/Footer';
import { useArticleStore } from './store/articleStore';

export default function HomePage() {
  const { filtered, fetchArticles, loading, error } = useArticleStore();

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <>
      

      <main className="p-8 max-w-6xl mx-auto min-h-[70vh]">
        <h2 className="text-3xl font-bold mb-6">Trending Articles</h2>

        {loading && <p className="text-blue-500">Loading articles...</p>}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-gray-500">No articles found. Please check back later.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      </main>

 
    </>
  );
}
