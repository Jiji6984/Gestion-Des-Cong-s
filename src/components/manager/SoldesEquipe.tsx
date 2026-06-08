"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { Wallet } from "lucide-react";

interface MembreInfo {
  employe_id: string;
  prenom: string;
  nom: string;
  soldes: { type_nom: string; type_couleur: string; restant: number; total: number }[];
}

const ANNEE = new Date().getFullYear();

export function SoldesEquipe({ managerId }: { managerId: string }) {
  const [membres, setMembres] = useState<MembreInfo[]>([]);
  const [chargement, setCharge] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data: equipe } = await supabase
        .from("employes")
        .select("id")
        .eq("manager_id", managerId);

      const ids = (equipe ?? []).map((e: any) => e.id);
      if (ids.length === 0) { setCharge(false); return; }

      const { data } = await supabase
        .from("vue_soldes_conge")
        .select("employe_id, employe_prenom, employe_nom, type_nom, type_couleur, restant, total")
        .in("employe_id", ids)
        .in("annee", [ANNEE, ANNEE - 1])
        .order("employe_nom")
        .order("annee", { ascending: false });

      // Garder uniquement l'année la plus récente par (employe, type)
      const seen = new Set<string>();
      const filtered = (data ?? []).filter((r: any) => {
        const key = `${r.employe_id}-${r.type_nom}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const map: Record<string, MembreInfo> = {};
      for (const r of filtered) {
        if (!map[r.employe_id]) {
          map[r.employe_id] = {
            employe_id: r.employe_id,
            prenom: r.employe_prenom,
            nom: r.employe_nom,
            soldes: [],
          };
        }
        map[r.employe_id].soldes.push({
          type_nom: r.type_nom,
          type_couleur: r.type_couleur,
          restant: r.restant,
          total: r.total,
        });
      }

      setMembres(Object.values(map));
      setCharge(false);
    };
    charger();
  }, [managerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-blue-600" />
          Soldes de l'équipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="text-sm text-gray-400 animate-pulse">Chargement…</div>
        ) : membres.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucun membre dans l'équipe.</p>
        ) : (
          <div className="space-y-4">
            {membres.map((m) => (
              <div key={m.employe_id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                    {m.prenom.charAt(0)}{m.nom.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{m.prenom} {m.nom}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {m.soldes.map((s) => {
                    const pct = s.total > 0 ? Math.round((s.restant / s.total) * 100) : 0;
                    const couleurBarre =
                      pct === 0 ? "#ef4444" :
                      pct <= 25 ? "#f97316" :
                      s.type_couleur;

                    return (
                      <div key={s.type_nom} className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: s.type_couleur }}
                            />
                            <span className="text-[11px] text-gray-500 truncate max-w-[80px]">{s.type_nom}</span>
                          </div>
                          <span className={`text-xs font-semibold ${
                            pct === 0 ? "text-red-500" : pct <= 25 ? "text-orange-500" : "text-gray-800"
                          }`}>
                            {s.restant}j
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: couleurBarre }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 text-right">/ {s.total}j</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
