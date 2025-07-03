'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useArticleStore } from '../store/articleStore';

const categories = [
  'All',
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

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { searchArticles, filter, reset } = useArticleStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      searchArticles(search);
      router.push('/');
    } else {
      reset();
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);

    if (value === 'All') {
      reset();
    } else {
      filter({ category: value });
    }
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-4 justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <img src="/trendview_icon.png" alt="TrendWise Icon" className="h-8 w-8" />
          <h1 className="text-2xl font-bold text-indigo-700 bg-gradient-to-r from-[#630692] to-[#265bdd] bg-clip-text text-transparent transition">
            TrendWise
          </h1>
        </Link>

        {/* Search + Filter */}
        <form onSubmit={handleSearch} className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search articles..."
            className="border px-3 py-2 rounded-lg focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border px-2 py-2 rounded-lg"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>

        {/* User */}
        <nav className="flex items-center space-x-6 ml-4">
          {session?.user ? (
            <>
              <span className="text-gray-700">Hello, {session.user.name?.split(' ')[0]}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-gradient-to-r from-[#630692] to-[#265bdd] text-white rounded-lg hover:brightness-110 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-[#630692] to-[#265bdd] text-white rounded-lg hover:brightness-110 transition"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
