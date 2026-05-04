"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

interface SoldeRow {
  id: string;
  type_nom: string;
  type_couleur: string;
  total: number;
  pris: number;
  restant: number;
}

export function SoldesConge() {
  const [soldes, setSoldes] = useState<SoldeRow[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const annee = new Date().getFullYear();
      const { data } = await supabase
        .from("vue_soldes_conge")
        .select("*")
        .eq("employe_id", user.id)
        .eq("annee", annee);

      setSoldes(data ?? []);
      setChargement(false);
    };
    charger();
  }, []);

  if (chargement) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Mes soldes de congés
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-100" />
                  <div className="h-4 w-24 rounded bg-gray-100" />
                  <div className="h-3 w-16 rounded bg-gray-100" />
                  <div className="h-1.5 w-full rounded bg-gray-100" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (soldes.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Mes soldes de congés
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
          Aucun solde défini pour cette année. Contactez votre administrateur RH.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Mes soldes de congés
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {soldes.map((s) => {
          const pourcentage = s.total > 0 ? Math.round((s.pris / s.total) * 100) : 0;
          return (
            <Card key={s.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: s.type_couleur }}
                  >
                    {s.type_nom.charAt(0)}
                  </div>
                  <span className="text-2xl font-bold" style={{ color: s.type_couleur }}>
                    {s.restant}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{s.type_nom}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.pris} pris sur {s.total} jours
                </p>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pourcentage}%`, backgroundColor: s.type_couleur }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
