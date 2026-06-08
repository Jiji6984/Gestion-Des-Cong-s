"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { Pencil, Check, X, RefreshCw, Sparkles } from "lucide-react";

interface SoldeRow {
  id: string;
  employe_id: string;
  employe_prenom: string;
  employe_nom: string;
  type_conge_id: string;
  type_nom: string;
  annee: number;
  total: number;
  pris: number;
  restant: number;
}

interface EmployeeSoldes {
  employe_id: string;
  prenom: string;
  nom: string;
  soldes: Record<string, SoldeRow>; // keyed by type_conge_id
}

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1];

export function GestionSoldes() {
  const [annee, setAnnee]       = useState(ANNEE_COURANTE);
  const [types, setTypes]       = useState<{ id: string; nom: string }[]>([]);
  const [lignes, setLignes]     = useState<EmployeeSoldes[]>([]);
  const [chargement, setCharge] = useState(true);
  const [initLoading, setInit]  = useState(false);
  const [initMsg, setInitMsg]   = useState<string | null>(null);

  // Édition inline
  const [editing, setEditing]   = useState<{ id: string; value: number } | null>(null);
  const [saveLoading, setSave]  = useState(false);
  const [saveError, setSaveErr] = useState<string | null>(null);

  /* ——— Chargement des types trackés ——— */
  useEffect(() => {
    supabase
      .from("types_conge")
      .select("id, nom")
      .not("limite_jours", "is", null)
      .eq("actif", true)
      .order("nom")
      .then(({ data }) => setTypes(data ?? []));
  }, []);

  /* ——— Chargement des soldes ——— */
  const charger = useCallback(async () => {
    setCharge(true);
    const { data } = await supabase
      .from("vue_soldes_conge")
      .select("*")
      .eq("annee", annee)
      .order("employe_nom")
      .order("type_nom");

    const map: Record<string, EmployeeSoldes> = {};
    for (const row of data ?? []) {
      if (!map[row.employe_id]) {
        map[row.employe_id] = {
          employe_id: row.employe_id,
          prenom: row.employe_prenom,
          nom: row.employe_nom,
          soldes: {},
        };
      }
      map[row.employe_id].soldes[row.type_conge_id] = row as SoldeRow;
    }
    setLignes(Object.values(map));
    setCharge(false);
  }, [annee]);

  useEffect(() => { charger(); }, [charger]);

  /* ——— Sauvegarder l'édition ——— */
  const sauvegarder = async () => {
    if (!editing) return;
    setSave(true);
    setSaveErr(null);
    const res = await fetch("/api/soldes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, total: editing.value }),
    });
    if (res.ok) {
      setEditing(null);
      await charger();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveErr(err.error ?? "Erreur lors de la sauvegarde.");
    }
    setSave(false);
  };

  /* ——— Initialiser l'année ——— */
  const initialiserAnnee = async () => {
    setInit(true);
    setInitMsg(null);
    const res = await fetch("/api/soldes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annee }),
    });
    if (res.ok) {
      const data = await res.json();
      setInitMsg(`✅ ${data.lignes} soldes initialisés pour ${annee}.`);
      await charger();
    } else {
      const err = await res.json().catch(() => ({}));
      setInitMsg(`❌ ${err.error ?? "Erreur."}`);
    }
    setInit(false);
  };

  /* ——— Render ——— */
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle>Soldes de congés</CardTitle>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sélecteur d'année */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {ANNEES.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAnnee(a); setEditing(null); setSaveErr(null); }}
                  className={`px-4 py-1.5 font-medium transition-colors ${
                    annee === a
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Initialiser l'année */}
            <Button size="sm" variant="secondary" onClick={initialiserAnnee} loading={initLoading}>
              <Sparkles className="h-4 w-4" />
              Initialiser {annee}
            </Button>

            {/* Rafraîchir */}
            <button
              onClick={charger}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {initMsg && (
          <p className={`text-sm mt-2 ${initMsg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {initMsg}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {chargement ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 animate-pulse">Chargement…</div>
        ) : lignes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400 mb-3">Aucun solde pour {annee}.</p>
            <Button size="sm" onClick={initialiserAnnee} loading={initLoading}>
              <Sparkles className="h-4 w-4" />
              Initialiser {annee}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  {types.map((t) => (
                    <th key={t.id} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {t.nom}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lignes.map((emp) => (
                  <tr key={emp.employe_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                          {emp.prenom.charAt(0)}{emp.nom.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{emp.prenom} {emp.nom}</span>
                      </div>
                    </td>

                    {types.map((t) => {
                      const solde = emp.soldes[t.id];
                      if (!solde) {
                        return (
                          <td key={t.id} className="px-4 py-4 text-center">
                            <span className="text-xs text-gray-300">—</span>
                          </td>
                        );
                      }

                      const isEditing = editing?.id === solde.id;

                      return (
                        <td key={t.id} className="px-4 py-4 text-center">
                          {isEditing ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <input
                                type="number"
                                min={solde.pris}
                                max={365}
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ id: solde.id, value: Number(e.target.value) })
                                }
                                className="w-16 text-center border border-blue-400 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") sauvegarder();
                                  if (e.key === "Escape") { setEditing(null); setSaveErr(null); }
                                }}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={sauvegarder}
                                  disabled={saveLoading}
                                  className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                                  title="Sauvegarder"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => { setEditing(null); setSaveErr(null); }}
                                  className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                                  title="Annuler"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {saveError && (
                                <p className="text-[10px] text-red-500 max-w-[120px] text-center">{saveError}</p>
                              )}
                            </div>
                          ) : (
                            <div className="group flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-semibold text-base ${
                                  solde.restant === 0
                                    ? "text-red-500"
                                    : solde.restant <= 3
                                    ? "text-orange-500"
                                    : "text-gray-900"
                                }`}>
                                  {solde.restant}j
                                </span>
                                <button
                                  onClick={() => setEditing({ id: solde.id, value: solde.total })}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-all"
                                  title="Modifier le total"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {solde.pris} pris / {solde.total} total
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
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
