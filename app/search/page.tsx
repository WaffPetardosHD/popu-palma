"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Navbar";

interface SearchUser {
  id: string;
  username: string;
  photo_url: string | null;
  elo: number;
  gender: string;
  rank: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.users || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-black text-gray-900">Buscar</h1>

      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un usuario..."
          className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition shadow-sm"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          No se encontraron usuarios para &ldquo;{query}&rdquo;
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 hover:border-orange-200 active:scale-[0.99] transition-all"
            >
              <Avatar
                username={user.username}
                photoUrl={user.photo_url}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">
                  {user.username}
                </p>
                <p className="text-xs text-gray-400">
                  {user.gender === "male" ? "Hombre" : "Mujer"} · #{user.rank} global
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-700 text-sm">{user.elo}</p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!query && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            Escribe al menos 2 caracteres para buscar
          </p>
        </div>
      )}
    </div>
  );
}
