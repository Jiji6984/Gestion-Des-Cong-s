"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday, parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";

interface Absence {
  employe_id: string;
  prenom: string;
  nom: string;
  type_nom: string;
  couleur: string;
  date_debut: string;
  date_fin: string;
}

type JourMap = Record<string, Absence[]>;

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dateStr(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function buildJourMap(absences: Absence[], debutGrille: Date, finGrille: Date): JourMap {
  const map: JourMap = {};
  for (const a of absences) {
    const start = parseISO(a.date_debut);
    const end   = parseISO(a.date_fin);
    // Intersecte avec la grille visible
    let cur   = new Date(Math.max(debutGrille.getTime(), start.getTime()));
    const stop = new Date(Math.min(finGrille.getTime(),   end.getTime()));
    while (cur <= stop) {
      const key = dateStr(cur);
      if (!map[key]) map[key] = [];
      map[key].push(a);
      cur = addDays(cur, 1);
    }
  }
  return map;
}

export function CalendrierAbsences() {
  const [moisCourant, setMois]  = useState(new Date());
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [chargement, setCharge] = useState(true);

  useEffect(() => {
    let annule = false;

    const charger = async () => {
      setCharge(true);

      // 1. Récupérer l'utilisateur et son rôle
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || annule) return;

      const { data: emp } = await supabase
        .from("employes").select("role").eq("id", user.id).single();
      const role = emp?.role ?? "employe";
      if (annule) return;

      // 2. Bornes du mois (format date uniquement)
      const debutMoisStr = format(startOfMonth(moisCourant), "yyyy-MM-dd");
      const finMoisStr   = format(endOfMonth(moisCourant),   "yyyy-MM-dd");

      // 3. Pour manager : récupérer les IDs de l'équipe
      let employeIds: string[] | null = null;
      if (role === "manager") {
        const { data: equipe } = await supabase
          .from("employes").select("id").eq("manager_id", user.id);
        employeIds = (equipe ?? []).map((e: any) => e.id);
        if (annule) return;
        if (employeIds.length === 0) { setAbsences([]); setCharge(false); return; }
      }

      // 4. Construire la requête
      let q = supabase
        .from("demandes_conge")
        .select(`
          employe_id, date_debut, date_fin,
          employes!employe_id ( prenom, nom ),
          types_conge!type_conge_id ( nom, couleur )
        `)
        .eq("statut", "approuve")
        .lte("date_debut", finMoisStr)
        .gte("date_fin", debutMoisStr);

      if (employeIds !== null) {
        q = q.in("employe_id", employeIds);
      }

      const { data } = await q.order("date_debut");
      if (annule) return;

      setAbsences(
        (data ?? []).map((d: any) => ({
          employe_id: d.employe_id,
          prenom:     d.employes?.prenom ?? "—",
          nom:        d.employes?.nom    ?? "—",
          type_nom:   d.types_conge?.nom    ?? "Congé",
          couleur:    d.types_conge?.couleur ?? "#6b7280",
          date_debut: d.date_debut,
          date_fin:   d.date_fin,
        }))
      );
      setCharge(false);
    };

    charger();
    return () => { annule = true; };
  }, [moisCourant]);

  /* ——— Construction de la grille ——— */
  const debutMois   = startOfMonth(moisCourant);
  const finMois     = endOfMonth(moisCourant);
  const debutGrille = startOfWeek(debutMois, { weekStartsOn: 1 });
  const finGrille   = endOfWeek(finMois,     { weekStartsOn: 1 });
  const jourMap     = buildJourMap(absences, debutGrille, finGrille);

  const semaines: Date[][] = [];
  let cur = debutGrille;
  while (cur <= finGrille) {
    const semaine: Date[] = [];
    for (let i = 0; i < 7; i++) { semaine.push(cur); cur = addDays(cur, 1); }
    semaines.push(semaine);
  }

  const MAX_PAR_JOUR = 3;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
        <button
          onClick={() => setMois(subMonths(moisCourant, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 capitalize">
          {format(moisCourant, "MMMM yyyy", { locale: fr })}
        </h2>
        <button
          onClick={() => setMois(addMonths(moisCourant, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grille */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* En-têtes */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {JOURS.map((j, i) => (
            <div key={j} className={`py-2 text-center text-xs font-semibold uppercase tracking-wider ${i >= 5 ? "text-gray-300" : "text-gray-500"}`}>
              {j}
            </div>
          ))}
        </div>

        {chargement ? (
          <div className="py-20 text-center text-sm text-gray-400 animate-pulse">Chargement…</div>
        ) : (
          <div>
            {semaines.map((semaine, si) => (
              <div key={si} className={`grid grid-cols-7 ${si < semaines.length - 1 ? "border-b border-gray-100" : ""}`}>
                {semaine.map((jour, ji) => {
                  const key       = dateStr(jour);
                  const entrees   = jourMap[key] ?? [];
                  const estMois   = isSameMonth(jour, moisCourant);
                  const estAuj    = isToday(jour);
                  const estWeekend = ji >= 5;

                  return (
                    <div
                      key={key}
                      className={`min-h-[100px] p-2 ${ji < 6 ? "border-r border-gray-100" : ""} ${
                        !estMois ? "bg-gray-50/50" : estWeekend ? "bg-gray-50/30" : "bg-white"
                      }`}
                    >
                      <div className="mb-1.5">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          estAuj ? "bg-blue-600 text-white" : estMois ? "text-gray-700" : "text-gray-300"
                        }`}>
                          {format(jour, "d")}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {entrees.slice(0, MAX_PAR_JOUR).map((a, i) => (
                          <div
                            key={`${a.employe_id}-${i}`}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium truncate"
                            style={{ backgroundColor: a.couleur + "20", color: a.couleur }}
                            title={`${a.prenom} ${a.nom} — ${a.type_nom}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.couleur }} />
                            <span className="truncate">{a.prenom} {a.nom.charAt(0)}.</span>
                          </div>
                        ))}
                        {entrees.length > MAX_PAR_JOUR && (
                          <p className="text-[10px] text-gray-400 pl-1">
                            +{entrees.length - MAX_PAR_JOUR} autre{entrees.length - MAX_PAR_JOUR > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Légende */}
      {absences.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Types</p>
          <div className="flex flex-wrap gap-3">
            {[...new Map(absences.map((a) => [a.type_nom, a])).values()].map((a) => (
              <div key={a.type_nom} className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.couleur }} />
                {a.type_nom}
              </div>
            ))}
          </div>
        </div>
      )}

      {!chargement && absences.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
          Aucune absence approuvée ce mois-ci.
        </div>
      )}
    </div>
  );
}
