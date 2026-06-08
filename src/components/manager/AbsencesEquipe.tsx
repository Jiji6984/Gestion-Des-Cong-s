"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, Users } from "lucide-react";

interface Absence {
  id: string;
  prenom: string;
  nom: string;
  type_nom: string;
  type_couleur: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
}

function labelPeriode(debut: string, fin: string): string {
  const d = parseISO(debut);
  const f = parseISO(fin);
  if (isToday(d) || (new Date() >= d && new Date() <= f)) return "Aujourd'hui";
  if (isTomorrow(d)) return "Demain";
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, "EEEE", { locale: fr });
  return format(d, "d MMM", { locale: fr });
}

export function AbsencesEquipe({ managerId }: { managerId: string }) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [chargement, setCharge] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data: equipe } = await supabase
        .from("employes")
        .select("id")
        .eq("manager_id", managerId);

      const ids = (equipe ?? []).map((e: any) => e.id);
      if (ids.length === 0) { setCharge(false); return; }

      // Absences en cours ou dans les 7 prochains jours
      const aujourd_hui = new Date().toISOString().split("T")[0];
      const dans7jours = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data } = await supabase
        .from("demandes_conge")
        .select(`
          id, date_debut, date_fin, nb_jours,
          employes!employe_id ( prenom, nom ),
          types_conge!type_conge_id ( nom, couleur )
        `)
        .in("employe_id", ids)
        .eq("statut", "approuve")
        .lte("date_debut", dans7jours)
        .gte("date_fin", aujourd_hui)
        .order("date_debut");

      setAbsences(
        (data ?? []).map((d: any) => ({
          id: d.id,
          prenom: d.employes?.prenom ?? "—",
          nom: d.employes?.nom ?? "—",
          type_nom: d.types_conge?.nom ?? "Congé",
          type_couleur: d.types_conge?.couleur ?? "#6b7280",
          date_debut: d.date_debut,
          date_fin: d.date_fin,
          nb_jours: d.nb_jours,
        }))
      );
      setCharge(false);
    };
    charger();
  }, [managerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-blue-600" />
          Absences — aujourd'hui &amp; 7 prochains jours
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chargement ? (
          <div className="text-sm text-gray-400 animate-pulse">Chargement…</div>
        ) : absences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Users className="h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-400">Aucune absence prévue cette semaine.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {absences.map((a) => {
              const label = labelPeriode(a.date_debut, a.date_fin);
              const isEnCours =
                new Date() >= parseISO(a.date_debut) &&
                new Date() <= parseISO(a.date_fin);

              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {a.prenom.charAt(0)}{a.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {a.prenom} {a.nom}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: a.type_couleur }}
                        />
                        <p className="text-xs text-gray-500">{a.type_nom}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {isEnCours && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-green-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          En cours
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-700 capitalize">{label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(a.date_debut), "d MMM", { locale: fr })}
                      {a.date_debut !== a.date_fin && (
                        <> → {format(parseISO(a.date_fin), "d MMM", { locale: fr })}</>
                      )}
                      {" · "}{a.nb_jours}j
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
