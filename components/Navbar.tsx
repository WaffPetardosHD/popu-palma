"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  user: { username: string; photo_url: string | null } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href
        ? "text-orange-500"
        : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-bold text-xl bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent shrink-0"
        >
          Popu Palma
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/vote" className={linkClass("/vote")}>
            Votar
          </Link>
          <Link href="/leaderboard" className={linkClass("/leaderboard")}>
            Top Semanal
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Avatar username={user.username} photoUrl={user.photo_url} size={28} />
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Avatar({
  username,
  photoUrl,
  size = 40,
}: {
  username: string;
  photoUrl: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username[0].toUpperCase()}
    </div>
  );
}
