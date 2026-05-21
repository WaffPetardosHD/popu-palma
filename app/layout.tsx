import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { getSession } from "@/lib/auth";
import getDb from "@/lib/db";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Popu Palma",
  description: "¿Quién es más popular en Palma de Mallorca?",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let user: { username: string; photo_url: string | null } | null = null;
  if (session) {
    const db = getDb();
    user =
      (db
        .prepare("SELECT username, photo_url FROM users WHERE id = ?")
        .get(session.userId) as {
        username: string;
        photo_url: string | null;
      } | null) ?? null;
  }

  return (
    <html lang="es" className="h-full">
      <body className={`${geist.className} min-h-full flex flex-col pb-16`}>
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
          {children}
        </main>
        <BottomNav user={user} />
      </body>
    </html>
  );
}
