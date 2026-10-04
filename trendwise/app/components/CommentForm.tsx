"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { apiFetch } from "../lib/api";

interface CommentFormProps {
  articleId: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function CommentForm({ articleId, user }: CommentFormProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name ?? session?.user?.name ?? "";
  const displayEmail = user?.email ?? session?.user?.email ?? "";

  /**
   * Three things were broken here:
   *  1. the URL was `${NEXT_PUBLIC_BASE_URL}/comments`, but the server mounts
   *     comments at `/api/comments` — every submit 404'd;
   *  2. no Authorization header, so verifyToken rejected it with 401 anyway;
   *  3. the body sent `userName`/`userEmail` and no `userId`, which failed the
   *     Comment schema's required `userId` and crashed the API (unhandled
   *     rejection in a handler with no try/catch).
   * The author now comes from the backend JWT server-side.
   */
  const submitComment = async () => {
    const token = session?.user?.token;
    if (!token || !comment.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/comments", {
        method: "POST",
        authToken: token,
        body: JSON.stringify({ articleId, content: comment.trim() }),
      });
      setComment("");
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      setError(err?.message ?? "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session && !user) return <p className="text-gray-500">Login to comment.</p>;

  if (!session?.user?.token)
    return (
      <p className="text-gray-500">
        Your session has no API token. Please sign out and back in.
      </p>
    );

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">
        Commenting as <span className="font-semibold">{displayName || displayEmail}</span>
      </p>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Write a comment..."
        rows={4}
      />
      <button
        onClick={submitComment}
        disabled={submitting || !comment.trim()}
        className="mt-2 bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
}
