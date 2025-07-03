'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

const API = process.env.NEXT_PUBLIC_BASE_URL!;
const CommentForm = dynamic(() => import('../../components/CommentForm'), { ssr: false });

export default function ArticleViewer() {
  const { id } = useParams() as { id: string };
  const { data: session, status } = useSession();
  const [article, setArticle] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const articleRes = await fetch(`${API}/api/articles/id/${id}`);
        if (!articleRes.ok) {
          if (articleRes.status === 404) setNotFound(true);
          else setError('Failed to load article');
          setLoading(false);
          return;
        }
        const articleData = await articleRes.json();
        setArticle(articleData);

        const commentRes = await fetch(`${API}/comments/${id}`);
        if (commentRes.ok) {
          const commentData = await commentRes.json();
          setComments(commentData);
        }
      } catch (err) {
        console.error('Error loading article:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    );

  if (notFound)
    return (
      <p className="text-center text-red-600 mt-12 text-lg font-semibold">
        Article not found.
      </p>
    );

  if (error)
    return (
      <p className="text-center text-red-600 mt-12 text-lg font-semibold">
        {error}
      </p>
    );

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-2 text-gray-900">{article.title}</h1>

      {/* Metadata */}
      <div className="text-sm text-gray-500 mb-6">
        <span>By {article.author?.name || 'Anonymous'} · </span>
        <span>{format(new Date(article.createdAt), 'MMMM dd, yyyy')}</span>
      </div>

      {/* Main Image */}
      {article.meta?.ogImage && (
        <img
          src={article.meta.ogImage}
          alt={article.title}
          className="w-full h-64 object-cover rounded-lg mb-8 shadow"
        />
      )}

      {/* Content */}
      <article
        className="prose prose-lg max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Media */}
      {article.media?.images?.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">More Images</h2>
          <div className="grid grid-cols-2 gap-6">
            {article.media.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`img-${i}`}
                className="rounded-lg shadow hover:scale-105 transform transition duration-300"
              />
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Comments</h2>
        {comments.length > 0 ? (
          comments.map((c, i) => (
            <div
              key={i}
              className="border-b border-gray-300 py-4 last:border-0"
            >
              <p className="text-xs text-gray-400 mb-1">
                {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="text-gray-700">{c.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No comments yet.</p>
        )}

        {/* Comment Form */}
        <div className="mt-8">
          {status === 'authenticated' ? (
            <CommentForm articleId={article._id} user={session.user} />
          ) : (
            <p className="text-gray-600">Please log in to post a comment.</p>
          )}
        </div>
      </section>
    </main>
  );
}
