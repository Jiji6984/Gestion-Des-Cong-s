"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error || !data.user) {
      setChargement(false);
      setErreur("Email ou mot de passe incorrect.");
      return;
    }

    // Récupérer le rôle pour rediriger vers le bon espace
    const { data: employe } = await supabase
      .from("employes")
      .select("role")
      .eq("id", data.user.id)
      .single<{ role: string }>();

    const role = employe?.role ?? "employe";

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "manager") {
      router.push("/manager");
    } else {
      router.push("/dashboard");
    }

    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <CalendarCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre espace</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Adresse e-mail"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="motDePasse"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              autoComplete="current-password"
            />

            {erreur && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <p className="text-sm text-red-600">{erreur}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={chargement} size="lg">
              Se connecter
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Mot de passe oublié ?{" "}
            <a href="#" className="text-blue-600 hover:underline">Réinitialiser</a>
          </p>
        </div>

        {/* Comptes de test */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comptes de test</p>
          <div className="space-y-2 text-xs text-gray-600">
            {[
              { role: "Admin RH",  email: "admin@conges.fr",           color: "bg-purple-100 text-purple-700" },
              { role: "Manager",   email: "thomas.bernard@conges.fr",  color: "bg-blue-100 text-blue-700" },
              { role: "Manager",   email: "claire.rousseau@conges.fr", color: "bg-blue-100 text-blue-700" },
              { role: "Employé",   email: "marie.dupont@conges.fr",    color: "bg-gray-100 text-gray-700" },
              { role: "Employé",   email: "julien.petit@conges.fr",    color: "bg-gray-100 text-gray-700" },
            ].map((c) => (
              <div key={c.email} className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.role}</span>
                <button
                  type="button"
                  className="text-blue-600 hover:underline truncate"
                  onClick={() => setEmail(c.email)}
                >
                  {c.email}
                </button>
              </div>
            ))}
            <p className="text-gray-400 pt-1">Mot de passe : <span className="font-mono font-semibold text-gray-600">Conges2025!</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
