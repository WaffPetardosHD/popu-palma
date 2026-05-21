"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Navbar";

interface BottomNavProps {
  user: { username: string; photo_url: string | null } | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const base =
    "flex flex-col items-center gap-0.5 px-4 py-2 transition-colors text-xs font-medium";
  const active = "text-orange-500";
  const inactive = "text-gray-400 hover:text-gray-600";

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-50 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {/* Votar — primera pestaña */}
        <Link
          href="/vote"
          className={`${base} ${isActive("/vote") ? active : inactive}`}
        >
          <VoteIcon active={isActive("/vote")} />
          <span>Votar</span>
        </Link>

        {/* Ranking */}
        <Link
          href="/"
          className={`${base} ${isActive("/") ? active : inactive}`}
        >
          <HomeIcon active={isActive("/")} />
          <span>Ranking</span>
        </Link>

        {/* Buscar */}
        <Link
          href="/search"
          className={`${base} ${isActive("/search") ? active : inactive}`}
        >
          <SearchIcon active={isActive("/search")} />
          <span>Buscar</span>
        </Link>

        {/* Perfil */}
        <Link
          href={user ? "/settings" : "/login"}
          className={`${base} ${isActive("/settings") || isActive("/login") ? active : inactive}`}
        >
          {user ? (
            <Avatar username={user.username} photoUrl={user.photo_url} size={28} />
          ) : (
            <ProfileIcon active={isActive("/login")} />
          )}
          <span>{user ? user.username.slice(0, 10) : "Perfil"}</span>
        </Link>
      </div>
    </nav>
  );
}

function VoteIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.5" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? "2.5" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
