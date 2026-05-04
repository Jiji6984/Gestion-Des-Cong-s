"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { StatutDemande } from "@/lib/database.types";

interface Demande {
  id: string;
  type_conge_id: string;
  type_nom: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: StatutDemande;
  commentaire_validateur: string | null;
  soumis_le: string;
}

export function HistoriqueConges() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("demandes_conge")
        .select(`
          id,
          type_conge_id,
          date_debut,
          date_fin,
          nb_jours,
          statut,
          commentaire_validateur,
          soumis_le,
          types_conge ( nom )
        `)
        .eq("employe_id", user.id)
        .order("soumis_le", { ascending: false })
        .limit(20);

      const demandes = (data ?? []).map((d: any) => ({
        ...d,
        type_nom: d.types_conge?.nom ?? "—",
      }));

      setDemandes(demandes);
      setChargement(false);
    };
    charger();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de mes demandes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {chargement ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 animate-pulse">
            Chargement…
          </div>
        ) : demandes.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Aucune demande pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Type", "Période", "Durée", "Statut", "Commentaire"].map((col) => (
                    <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {demandes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{d.type_nom}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(d.date_debut), "d MMM yyyy", { locale: fr })}
                      {d.date_debut !== d.date_fin && (
                        <> → {format(new Date(d.date_fin), "d MMM yyyy", { locale: fr })}</>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {d.nb_jours} jour{d.nb_jours > 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4">
                      <Badge statut={d.statut} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                      {d.commentaire_validateur ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
