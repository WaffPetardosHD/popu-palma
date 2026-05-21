"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La foto no puede superar los 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!gender) {
      setError("Elige tu género");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("gender", gender);
      if (photoFile) formData.append("photo", photoFile);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrarse");
      } else {
        router.push("/vote");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear perfil</h1>
        <p className="text-gray-500 text-sm mb-6">Únete a Popu Palma</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-xs text-gray-400">Foto</span>
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
            <p className="text-xs text-gray-400">Opcional · máx 5MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="tu_usuario"
              minLength={3}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Género
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "male", label: "Hombre" },
                { value: "female", label: "Mujer" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    gender === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
          >
            {loading ? "Creando perfil..." : "Crear perfil"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-orange-500 font-medium hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
