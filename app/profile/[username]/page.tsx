import { notFound } from "next/navigation";
import getDb from "@/lib/db";
import { getWeekStart } from "@/lib/elo";
import { getSession } from "@/lib/auth";
import { Avatar } from "@/components/Navbar";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getDb();
  const weekStart = getWeekStart();

  const user = db
    .prepare(
      "SELECT id, username, gender, photo_url, elo, created_at FROM users WHERE username = ?"
    )
    .get(username) as {
    id: string;
    username: string;
    gender: string;
    photo_url: string | null;
    elo: number;
    created_at: string;
  } | null;

  if (!user) notFound();

  const totalWins = (
    db
      .prepare("SELECT COUNT(*) as c FROM votes WHERE winner_id = ?")
      .get(user.id) as { c: number }
  ).c;
  const totalLosses = (
    db
      .prepare("SELECT COUNT(*) as c FROM votes WHERE loser_id = ?")
      .get(user.id) as { c: number }
  ).c;
  const weeklyWins = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM votes WHERE winner_id = ? AND created_at >= ?"
      )
      .get(user.id, weekStart) as { c: number }
  ).c;
  const weeklyGain = (
    db
      .prepare(`
        SELECT COALESCE(SUM(
          CASE WHEN winner_id = ? THEN winner_elo_change
               WHEN loser_id  = ? THEN loser_elo_change END
        ), 0) AS gain
        FROM votes
        WHERE (winner_id = ? OR loser_id = ?) AND created_at >= ?
      `)
      .get(user.id, user.id, user.id, user.id, weekStart) as { gain: number }
  ).gain;
  const rank =
    (
      db
        .prepare("SELECT COUNT(*) as c FROM users WHERE elo > ?")
        .get(user.elo) as { c: number }
    ).c + 1;

  const winRate =
    totalWins + totalLosses > 0
      ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
      : null;

  const session = await getSession();
  const isOwnProfile = session?.userId === user.id;

  const joinDate = new Date(user.created_at).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-8 max-w-sm mx-auto">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full flex flex-col items-center gap-4">
        <Avatar username={user.username} photoUrl={user.photo_url} size={120} />
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">{user.username}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {user.gender === "male" ? "Hombre" : "Mujer"} · {joinDate}
          </p>
        </div>

        {/* ELO highlight */}
        <div className="bg-linear-to-br from-orange-50 to-rose-50 border border-orange-100 rounded-2xl px-8 py-4 text-center w-full">
          <p className="text-4xl font-black bg-linear-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            {user.elo}
          </p>
          <p className="text-sm text-gray-500 font-medium">puntos totales</p>
          <p className="text-xs text-gray-400 mt-1">Posición #{rank}</p>
        </div>

        {isOwnProfile && (
          <p className="text-xs text-orange-400 font-medium">Tu perfil</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <StatCard
          label="Esta semana"
          value={weeklyGain > 0 ? `+${weeklyGain}` : String(weeklyGain)}
          sub={`${weeklyWins} victorias`}
          highlight={weeklyGain > 0}
        />
        <StatCard
          label="Victorias totales"
          value={String(totalWins)}
          sub={`${totalLosses} derrotas`}
        />
        <StatCard
          label="Tasa de victoria"
          value={winRate !== null ? `${winRate}%` : "—"}
          sub={`${totalWins + totalLosses} votos recibidos`}
        />
        <StatCard label="Ranking" value={`#${rank}`} sub="global" />
      </div>

      <Link
        href="/leaderboard"
        className="text-sm text-orange-500 hover:underline"
      >
        Ver top semanal
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p
        className={`text-2xl font-black ${
          highlight ? "text-green-500" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
