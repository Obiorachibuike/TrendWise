'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/article/${article._id}`} className="block">
      {/* Gradient border wrapper */}
      <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[#630692] to-[#265bdd] hover:from-[#265bdd] hover:to-[#630692] transition-colors duration-500">
        {/* White card with cool shadow */}
        <div className="bg-white border border-transparent rounded-2xl overflow-hidden shadow-[0_10px_15px_-3px_rgba(99,6,146,0.4),0_4px_6px_-2px_rgba(38,91,221,0.3)] hover:shadow-[0_20px_25px_-5px_rgba(99,6,146,0.5),0_10px_10px_-5px_rgba(38,91,221,0.4)] transition-shadow duration-300 cursor-pointer">
          {article.meta?.ogImage && (
            <Image
              src={article.meta.ogImage}
              alt={article.title}
              width={800}
              height={400}
              className="w-full h-52 object-cover transition-transform duration-300 hover:scale-105"
            />
          )}

          <div className="p-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 hover:text-indigo-600 line-clamp-2">
              {article.title}
            </h2>
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">
              {article.meta?.description}
            </p>

            <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              <span className="italic">Read more →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
