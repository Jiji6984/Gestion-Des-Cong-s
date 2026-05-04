"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Stats {
  en_attente: number;
  approuve_mois: number;
  refuse_mois: number;
  employes: number;
}

export function StatistiquesAdmin() {
  const [stats, setStats] = useState<Stats>({ en_attente: 0, approuve_mois: 0, refuse_mois: 0, employes: 0 });

  useEffect(() => {
    const charger = async () => {
      const debut_mois = new Date();
      debut_mois.setDate(1);
      debut_mois.setHours(0, 0, 0, 0);

      const [{ count: enAttente }, { count: approveMois }, { count: refuseMois }, { count: nbEmployes }] =
        await Promise.all([
          supabase.from("demandes_conge").select("*", { count: "exact", head: true }).eq("statut", "en_attente"),
          supabase.from("demandes_conge").select("*", { count: "exact", head: true }).eq("statut", "approuve").gte("traite_le", debut_mois.toISOString()),
          supabase.from("demandes_conge").select("*", { count: "exact", head: true }).eq("statut", "refuse").gte("traite_le", debut_mois.toISOString()),
          supabase.from("employes").select("*", { count: "exact", head: true }),
        ]);

      setStats({
        en_attente: enAttente ?? 0,
        approuve_mois: approveMois ?? 0,
        refuse_mois: refuseMois ?? 0,
        employes: nbEmployes ?? 0,
      });
    };
    charger();
  }, []);

  const items = [
    { label: "En attente", valeur: stats.en_attente, icone: Clock, couleur: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Approuvées ce mois", valeur: stats.approuve_mois, icone: CheckCircle, couleur: "text-green-600", bg: "bg-green-50" },
    { label: "Refusées ce mois", valeur: stats.refuse_mois, icone: XCircle, couleur: "text-red-600", bg: "bg-red-50" },
    { label: "Employés actifs", valeur: stats.employes, icone: Users, couleur: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => {
        const Icon = s.icone;
        return (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.couleur}`}>{s.valeur}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <Icon className={`h-6 w-6 ${s.couleur}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
