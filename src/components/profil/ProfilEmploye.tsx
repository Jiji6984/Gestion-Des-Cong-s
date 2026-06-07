"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { User, Lock } from "lucide-react";

const roleLabel: Record<string, string> = {
  admin:   "Admin RH",
  manager: "Manager",
  employe: "Employé",
};

const roleBadgeStyle: Record<string, string> = {
  admin:   "bg-purple-50 text-purple-700 ring-purple-200",
  manager: "bg-blue-50 text-blue-700 ring-blue-200",
  employe: "bg-gray-50 text-gray-600 ring-gray-200",
};

export function ProfilEmploye() {
  const [employe, setEmploye]       = useState<any>(null);
  const [manager, setManager]       = useState<any>(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirm]  = useState("");
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: emp } = await supabase
        .from("employes")
        .select("id, nom, prenom, email, role, departement, manager_id")
        .eq("id", user.id)
        .single();

      setEmploye(emp);

      if (emp?.manager_id) {
        const { data: mgr } = await supabase
          .from("employes")
          .select("prenom, nom")
          .eq("id", emp.manager_id)
          .single();
        setManager(mgr);
      }
    };
    charger();
  }, []);

  const changerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (motDePasse.length < 8) {
      setMsg({ type: "error", text: "Le mot de passe doit faire au moins 8 caractères." });
      return;
    }
    if (motDePasse !== confirmation) {
      setMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setLoading(false);
    if (error) {
      setMsg({ type: "error", text: error.message });
    } else {
      setMsg({ type: "success", text: "Mot de passe mis à jour avec succès !" });
      setMotDePasse("");
      setConfirm("");
    }
  };

  if (!employe) {
    return (
      <div className="max-w-2xl space-y-4 animate-pulse">
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* ——— Informations personnelles ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Prénom</p>
              <p className="text-sm font-medium text-gray-900">{employe.prenom}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Nom</p>
              <p className="text-sm font-medium text-gray-900">{employe.nom}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Email</p>
            <p className="text-sm font-medium text-gray-900">{employe.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Rôle</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${roleBadgeStyle[employe.role] ?? roleBadgeStyle.employe}`}>
                {roleLabel[employe.role] ?? employe.role}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Département</p>
              <p className="text-sm font-medium text-gray-900">{employe.departement ?? "—"}</p>
            </div>
          </div>

          {manager && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Manager</p>
              <p className="text-sm font-medium text-gray-900">{manager.prenom} {manager.nom}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ——— Changement de mot de passe ——— */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-600" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changerMotDePasse} className="space-y-4">
            <Input
              id="mdp"
              type="password"
              label="Nouveau mot de passe"
              placeholder="Min. 8 caractères"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
            <Input
              id="confirm"
              type="password"
              label="Confirmer le mot de passe"
              placeholder="Répétez le mot de passe"
              value={confirmation}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {msg && (
              <div className={`rounded-lg px-3 py-2.5 text-sm border ${
                msg.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}>
                {msg.text}
              </div>
            )}

            <Button type="submit" loading={loading}>
              Mettre à jour le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
