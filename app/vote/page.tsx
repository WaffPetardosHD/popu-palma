"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Navbar";

interface UserProfile {
  id: string;
  username: string;
  elo: number;
  photo_url: string | null;
}

interface VotePair {
  userA: UserProfile;
  userB: UserProfile;
  gender: "male" | "female";
}

type VoteState = "idle" | "voted";

export default function VotePage() {
  const [pair, setPair] = useState<VotePair | null>(null);
  const [gender, setGender] = useState<"male" | "female">("female");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [eloChanges, setEloChanges] = useState<{ winner: number; loser: number } | null>(null);
  const [noPairs, setNoPairs] = useState(false);
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const fetchPair = useCallback(async (g: "male" | "female") => {
    setLoading(true);
    setNoPairs(false);
    setLimitReason(null);
    setVoteState("idle");
    setWinnerId(null);
    setEloChanges(null);
    try {
      const res = await fetch(`/api/vote/pair?gender=${g}`);
      const data = await res.json();
      if (data.pair) {
        setPair(data.pair);
        if (data.remaining !== undefined) setRemaining(data.remaining);
      } else {
        setNoPairs(true);
        setPair(null);
        if (data.reason === "daily_limit_reached") {
          setLimitReason("Has usado tus 20 votos de hoy. ¡Vuelve mañana!");
        }
      }
    } catch {
      setNoPairs(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPair(gender);
  }, [gender, fetchPair]);

  const handleVote = async (winner: UserProfile, loser: UserProfile) => {
    if (voting || voteState !== "idle") return;
    setVoting(true);
    setWinnerId(winner.id);
    try {
      const res = await fetch("/api/vote/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: winner.id, loserId: loser.id }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimitReason(data.error);
        setNoPairs(true);
        setPair(null);
        setVoting(false);
        setWinnerId(null);
        return;
      }
      if (res.ok) {
        setEloChanges({ winner: data.winnerChange, loser: data.loserChange });
        setVoteState("voted");
        if (data.remaining !== undefined) setRemaining(data.remaining);
        setTimeout(() => {
          setVoting(false);
          if (data.remaining === 0) {
            setLimitReason("Has usado tus 20 votos de hoy. ¡Vuelve mañana!");
            setNoPairs(true);
            setPair(null);
          } else {
            fetchPair(gender);
          }
        }, 1600);
      } else {
        setVoting(false);
        setWinnerId(null);
      }
    } catch {
      setVoting(false);
      setWinnerId(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">Votar</h1>
        {remaining !== null && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-3 py-1">
            <span className="text-orange-500 text-xs font-bold">
              {remaining} votos hoy
            </span>
          </div>
        )}
      </div>

      {/* Gender toggle */}
      <div className="flex bg-white rounded-full shadow-sm border border-gray-100 p-1 gap-1 w-full max-w-xs justify-center">
        {(["female", "male"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
              gender === g
                ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {g === "female" ? "Chicas" : "Chicos"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Daily limit reached */}
      {!loading && limitReason && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="text-5xl">⚡</div>
          <p className="font-bold text-gray-800 text-lg">{limitReason}</p>
          <p className="text-gray-400 text-sm">
            Los votos se renuevan cada día a medianoche.
          </p>
          <Link
            href="/"
            className="mt-2 bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity"
          >
            Ver el ranking
          </Link>
        </div>
      )}

      {/* Not enough users */}
      {!loading && noPairs && !limitReason && (
        <div className="text-center py-16">
          <p className="text-gray-400">
            No hay suficientes perfiles para votar.
          </p>
        </div>
      )}

      {/* Vote cards */}
      {!loading && pair && (
        <>
          <p className="text-sm text-gray-400 -mb-2">
            ¿A quién prefieres?
          </p>
          <div className="flex items-center gap-3 w-full">
            <VoteCard
              user={pair.userA}
              state={voteState === "voted" ? (winnerId === pair.userA.id ? "winner" : "loser") : "idle"}
              eloChange={voteState === "voted" ? (winnerId === pair.userA.id ? eloChanges?.winner : eloChanges?.loser) : undefined}
              onClick={() => handleVote(pair.userA, pair.userB)}
              disabled={voting}
            />

            <div className="text-xl font-black text-gray-200 shrink-0">VS</div>

            <VoteCard
              user={pair.userB}
              state={voteState === "voted" ? (winnerId === pair.userB.id ? "winner" : "loser") : "idle"}
              eloChange={voteState === "voted" ? (winnerId === pair.userB.id ? eloChanges?.winner : eloChanges?.loser) : undefined}
              onClick={() => handleVote(pair.userB, pair.userA)}
              disabled={voting}
            />
          </div>
          {voteState === "idle" && (
            <p className="text-xs text-gray-400">Toca el perfil que prefieras</p>
          )}
        </>
      )}
    </div>
  );
}

function VoteCard({
  user, state, eloChange, onClick, disabled,
}: {
  user: UserProfile;
  state: "idle" | "winner" | "loser";
  eloChange?: number;
  onClick: () => void;
  disabled: boolean;
}) {
  const isWinner = state === "winner";
  const isLoser = state === "loser";

  const borderCls = isWinner
    ? "border-green-400 scale-[1.02]"
    : isLoser
    ? "border-gray-200 opacity-50 scale-[0.98]"
    : "border-transparent hover:border-orange-400 active:scale-[0.99]";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 cursor-pointer rounded-2xl bg-white shadow-md border-2 transition-all duration-200 select-none overflow-hidden flex flex-col ${borderCls}`}
    >
      {/* Foto rectangular */}
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center">
            <span className="text-white font-black text-5xl">
              {user.username[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay ganador */}
        {isWinner && (
          <div className="absolute inset-0 bg-green-500/10 flex items-end justify-center pb-3">
            <span className="bg-green-500 text-white font-black text-sm px-3 py-1 rounded-full shadow">
              ✓ Ganador
            </span>
          </div>
        )}

        {/* Badge ELO */}
        {eloChange !== undefined && (
          <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow ${isWinner ? "bg-green-500" : "bg-gray-400"}`}>
            {isWinner ? `+${eloChange}` : eloChange}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 text-center">
        <p className="font-bold text-gray-900 text-sm truncate">{user.username}</p>
        <p className="text-xs text-gray-400">{user.elo} pts</p>
      </div>
    </button>
  );
}
