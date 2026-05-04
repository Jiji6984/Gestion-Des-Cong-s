"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    // TODO: intégrer Supabase Auth
    await new Promise((r) => setTimeout(r, 1000));
    setChargement(false);
    setErreur("Email ou mot de passe incorrect.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <CalendarCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Congés</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Formulaire */}
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
            <a href="#" className="text-blue-600 hover:underline">
              Réinitialiser
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
