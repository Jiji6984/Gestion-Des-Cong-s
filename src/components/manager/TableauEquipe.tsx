"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Eye } from "lucide-react";
import type { StatutDemande } from "@/lib/database.types";

interface Demande {
  id: string;
  employe_prenom: string;
  employe_nom: string;
  type_nom: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: StatutDemande;
  motif: string | null;
  soumis_le: string;
}

const filtres: { label: string; valeur: StatutDemande | "tous" }[] = [
  { label: "Toutes", valeur: "tous" },
  { label: "En attente", valeur: "en_attente" },
  { label: "Approuvées", valeur: "approuve" },
  { label: "Refusées", valeur: "refuse" },
];

export function TableauEquipe({ managerId }: { managerId: string }) {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<StatutDemande | "tous">("en_attente");
  const [traitement, setTraitement] = useState<string | null>(null);

  const charger = async () => {
    const { data: equipe } = await supabase
      .from("employes")
      .select("id")
      .eq("manager_id", managerId);

    const ids = (equipe ?? []).map((e) => e.id);
    if (ids.length === 0) { setChargement(false); return; }

    const { data } = await supabase
      .from("demandes_conge")
      .select(`
        id, date_debut, date_fin, nb_jours, statut, motif, soumis_le,
        employes!employe_id ( nom, prenom ),
        types_conge ( nom )
      `)
      .in("employe_id", ids)
      .order("soumis_le", { ascending: false });

    const mapped = (data ?? []).map((d: any) => ({
      id: d.id,
      employe_prenom: d.employes?.prenom ?? "—",
      employe_nom: d.employes?.nom ?? "—",
      type_nom: d.types_conge?.nom ?? "—",
      date_debut: d.date_debut,
      date_fin: d.date_fin,
      nb_jours: d.nb_jours,
      statut: d.statut,
      motif: d.motif,
      soumis_le: d.soumis_le,
    }));

    setDemandes(mapped);
    setChargement(false);
  };

  useEffect(() => { charger(); }, [managerId]);

  const changer = async (id: string, statut: StatutDemande) => {
    setTraitement(id);

    const res = await fetch("/api/valider-demande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: id, action: statut, validateur_id: managerId }),
    });

    if (res.ok) {
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut } : d));
    }
    setTraitement(null);
  };

  const demandesFiltrees = filtre === "tous" ? demandes : demandes.filter((d) => d.statut === filtre);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Demandes de mon équipe</CardTitle>
          <div className="flex gap-1.5">
            {filtres.map((f) => (
              <button
                key={f.valeur}
                onClick={() => setFiltre(f.valeur)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtre === f.valeur
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {chargement ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 animate-pulse">Chargement…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Employé", "Type", "Période", "Durée", "Soumis le", "Statut", "Actions"].map((col) => (
                    <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandesFiltrees.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {d.employe_prenom} {d.employe_nom}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{d.type_nom}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {format(new Date(d.date_debut), "d MMM", { locale: fr })}
                      {d.date_debut !== d.date_fin && (
                        <> → {format(new Date(d.date_fin), "d MMM yyyy", { locale: fr })}</>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{d.nb_jours}j</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(d.soumis_le), "d MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4"><Badge statut={d.statut} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {d.statut === "en_attente" && (
                          <>
                            <button
                              onClick={() => changer(d.id, "approuve")}
                              disabled={traitement === d.id}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-40 transition-colors"
                              title="Approuver"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => changer(d.id, "refuse")}
                              disabled={traitement === d.id}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                              title="Refuser"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="Détail">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {demandesFiltrees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      Aucune demande pour ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
