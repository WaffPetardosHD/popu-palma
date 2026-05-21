import { getWeekStart } from "@/lib/elo";
import getDb from "@/lib/db";
import Link from "next/link";
import { Avatar } from "@/components/Navbar";

interface LeaderRow {
  id: string;
  username: string;
  photo_url: string | null;
  elo: number;
  gender: string;
  weekly_gain: number;
  weekly_wins: number;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ gender?: string }>;
}) {
  const { gender = "all" } = await searchParams;
  const db = getDb();
  const weekStart = getWeekStart();

  const baseQuery = `
    SELECT
      u.id, u.username, u.photo_url, u.elo, u.gender,
      COALESCE(SUM(
        CASE
          WHEN v.winner_id = u.id THEN v.winner_elo_change
          WHEN v.loser_id  = u.id THEN v.loser_elo_change
          ELSE 0
        END
      ), 0) AS weekly_gain,
      COUNT(CASE WHEN v.winner_id = u.id THEN 1 END) AS weekly_wins
    FROM users u
    LEFT JOIN votes v
      ON (v.winner_id = u.id OR v.loser_id = u.id)
      AND v.created_at >= ?
  `;

  const rows: LeaderRow[] =
    gender !== "all"
      ? (db
          .prepare(
            `${baseQuery} WHERE u.gender = ? GROUP BY u.id ORDER BY weekly_gain DESC LIMIT 50`
          )
          .all(weekStart, gender) as LeaderRow[])
      : (db
          .prepare(
            `${baseQuery} GROUP BY u.id ORDER BY weekly_gain DESC LIMIT 50`
          )
          .all(weekStart) as LeaderRow[]);

  const weekLabel = new Date(weekStart).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Top Semanal</h1>
        <p className="text-gray-500 text-sm mt-1">Semana del {weekLabel}</p>
      </div>

      {/* Filter */}
      <div className="flex bg-white rounded-full shadow-sm border border-gray-100 p-1 gap-1 self-start">
        {[
          { value: "all", label: "Todos" },
          { value: "female", label: "Chicas" },
          { value: "male", label: "Chicos" },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`/leaderboard?gender=${opt.value}`}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
              gender === opt.value
                ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">
            Aún no hay votos esta semana. ¡Sé el primero en{" "}
            <Link href="/vote" className="text-orange-500 hover:underline">
              votar
            </Link>
            !
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/profile/${row.username}`}
              className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 hover:border-orange-200 transition-colors"
            >
              <span
                className={`w-8 text-center font-black text-lg shrink-0 ${
                  i === 0
                    ? "text-amber-400"
                    : i === 1
                    ? "text-gray-400"
                    : i === 2
                    ? "text-amber-600"
                    : "text-gray-300"
                }`}
              >
                {i + 1}
              </span>

              <Avatar
                username={row.username}
                photoUrl={row.photo_url}
                size={48}
              />

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {row.username}
                </p>
                <p className="text-xs text-gray-400">
                  {row.weekly_wins} victorias esta semana
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`font-bold text-sm ${
                    row.weekly_gain > 0
                      ? "text-green-500"
                      : row.weekly_gain < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {row.weekly_gain > 0 ? "+" : ""}
                  {row.weekly_gain} pts
                </p>
                <p className="text-xs text-gray-400">{row.elo} total</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
