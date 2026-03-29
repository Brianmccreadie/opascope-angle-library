'use client';

import { useEffect, useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function SearchBar({ onSearch, sort, onSortChange }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search hooks, concepts, headlines..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title">A-Z</option>
      </select>
    </div>
  );
}
