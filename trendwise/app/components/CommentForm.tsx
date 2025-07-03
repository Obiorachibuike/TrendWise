"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

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

  const submitComment = async () => {
    if ((!session && !user) || !comment.trim()) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email ?? session?.user?.email ?? "",
        },
        body: JSON.stringify({
          articleId,
          content: comment,
          userName: user?.name ?? session?.user?.name ?? "",
          userEmail: user?.email ?? session?.user?.email ?? "",
        }),
      });
      setComment("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  if (!session && !user)
    return <p className="text-gray-500">Login to comment.</p>;

  return (
    <div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Write a comment..."
        rows={4}
      />
      <button
        onClick={submitComment}
        className="mt-2 bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700"
      >
        Post Comment
      </button>
    </div>
  );
}
