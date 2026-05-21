"use client";

import { useState, useEffect } from "react";
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

const GENDERS = [
  { value: "all", label: "Todos" },
  { value: "female", label: "Chicas" },
  { value: "male", label: "Chicos" },
];

export default function HomePage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [gender, setGender] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?gender=${gender}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.leaderboard || []);
        setWeekStart(data.weekStart || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gender]);

  const visible = expanded ? rows : rows.slice(0, 10);

  const weekLabel = weekStart
    ? new Date(weekStart + "T00:00:00Z").toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })
    : "";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black bg-linear-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
          Popu Palma
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Top semanal · semana del {weekLabel}
        </p>
      </div>

      {/* Gender filter */}
      <div className="flex bg-white rounded-full shadow-sm border border-gray-100 p-1 gap-1 self-start">
        {GENDERS.map((g) => (
          <button
            key={g.value}
            onClick={() => { setGender(g.value); setExpanded(false); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              gender === g.value
                ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">Nadie ha votado aún esta semana.</p>
          <Link href="/vote" className="text-orange-500 text-sm hover:underline mt-2 block">
            ¡Sé el primero en votar!
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((row, i) => (
            <LeaderCard key={row.id} row={row} rank={i + 1} />
          ))}

          {rows.length > 10 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors"
            >
              {expanded
                ? "Ver menos"
                : `Ver top ${Math.min(rows.length, 100)} completo`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderCard({ row, rank }: { row: LeaderRow; rank: number }) {
  const medalColor =
    rank === 1
      ? "text-amber-400"
      : rank === 2
      ? "text-slate-400"
      : rank === 3
      ? "text-amber-600"
      : "text-gray-300";

  return (
    <Link
      href={`/profile/${row.username}`}
      className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 hover:border-orange-200 active:scale-[0.99] transition-all"
    >
      <span className={`w-7 text-center font-black text-lg shrink-0 ${medalColor}`}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
      </span>

      <Avatar username={row.username} photoUrl={row.photo_url} size={44} />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{row.username}</p>
        <p className="text-xs text-gray-400">
          {row.weekly_wins} {row.weekly_wins === 1 ? "victoria" : "victorias"} · {row.elo} pts totales
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
          {row.weekly_gain}
        </p>
        <p className="text-xs text-gray-400">esta semana</p>
      </div>
    </Link>
  );
}
