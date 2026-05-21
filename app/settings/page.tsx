"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Navbar";

interface UserData {
  id: string;
  username: string;
  email: string;
  gender: string;
  photo_url: string | null;
  elo: number;
}

interface ProfileStats {
  totalWins: number;
  totalLosses: number;
  weeklyGain: number;
  rank: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showPwdForm, setShowPwdForm] = useState(false);

  // Feedback
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [photoMsg, setPhotoMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        setUsername(data.user.username);
        // Fetch profile stats
        const profileRes = await fetch(`/api/profile/${data.user.username}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setStats({ ...profileData.stats, rank: profileData.rank });
        }
        setLoading(false);
      });
  }, [router]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg({ text: "Máximo 5MB", ok: false });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMsg(null);

    // Auto-upload photo immediately
    const formData = new FormData();
    formData.append("photo", file);
    setPhotoMsg({ text: "Subiendo...", ok: true });
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setPhotoMsg({ text: "Foto actualizada", ok: true });
      } else {
        setPhotoMsg({ text: data.error, ok: false });
      }
    } catch {
      setPhotoMsg({ text: "Error al subir la foto", ok: false });
    }
  };

  const handleSaveUsername = async () => {
    if (!username || username === user?.username) return;
    setSavingUsername(true);
    setUsernameMsg(null);
    const formData = new FormData();
    formData.append("username", username);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setUsernameMsg({ text: "Usuario actualizado", ok: true });
        router.refresh();
      } else {
        setUsernameMsg({ text: data.error, ok: false });
      }
    } catch {
      setUsernameMsg({ text: "Error de conexión", ok: false });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) return;
    setSavingPwd(true);
    setPwdMsg(null);
    const formData = new FormData();
    formData.append("currentPassword", currentPwd);
    formData.append("newPassword", newPwd);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ text: "Contraseña actualizada", ok: true });
        setCurrentPwd("");
        setNewPwd("");
        setShowPwdForm(false);
      } else {
        setPwdMsg({ text: data.error, ok: false });
      }
    } catch {
      setPwdMsg({ text: "Error de conexión", ok: false });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-black text-gray-900">Mi perfil</h1>

      {/* Avatar section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative group"
        >
          <Avatar
            username={user.username}
            photoUrl={photoPreview || user.photo_url}
            size={88}
          />
          <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold">Cambiar</span>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <p className="font-bold text-gray-900">{user.username}</p>
        <p className="text-sm text-gray-400">
          {user.gender === "male" ? "Hombre" : "Mujer"} · {user.email}
        </p>
        {photoMsg && (
          <p className={`text-xs ${photoMsg.ok ? "text-green-500" : "text-red-500"}`}>
            {photoMsg.text}
          </p>
        )}
        <p className="text-xs text-gray-400">Toca la foto para cambiarla</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-black text-orange-500">{user.elo}</p>
          <p className="text-xs text-gray-400">Puntos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-black text-gray-900">
            {stats ? `#${stats.rank}` : "—"}
          </p>
          <p className="text-xs text-gray-400">Ranking</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 text-center">
          <p className="text-xl font-black text-gray-900">
            {stats ? stats.totalWins : "—"}
          </p>
          <p className="text-xs text-gray-400">Victorias</p>
        </div>
      </div>

      {/* Username */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
        <h2 className="font-bold text-gray-700 text-sm">Nombre de usuario</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setUsernameMsg(null); }}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            placeholder="tu_usuario"
            minLength={3}
            maxLength={20}
          />
          <button
            onClick={handleSaveUsername}
            disabled={savingUsername || !username || username === user.username}
            className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {savingUsername ? "..." : "Guardar"}
          </button>
        </div>
        {usernameMsg && (
          <p className={`text-xs ${usernameMsg.ok ? "text-green-500" : "text-red-500"}`}>
            {usernameMsg.text}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-700 text-sm">Contraseña</h2>
          <button
            onClick={() => { setShowPwdForm(!showPwdForm); setPwdMsg(null); }}
            className="text-orange-500 text-sm font-medium"
          >
            {showPwdForm ? "Cancelar" : "Cambiar"}
          </button>
        </div>

        {showPwdForm && (
          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Contraseña actual"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Nueva contraseña (mín. 6)"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            <button
              onClick={handleChangePassword}
              disabled={savingPwd || !currentPwd || !newPwd}
              className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {savingPwd ? "Cambiando..." : "Actualizar contraseña"}
            </button>
            {pwdMsg && (
              <p className={`text-xs ${pwdMsg.ok ? "text-green-500" : "text-red-500"}`}>
                {pwdMsg.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl border-2 border-red-100 text-red-400 font-semibold text-sm hover:bg-red-50 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
