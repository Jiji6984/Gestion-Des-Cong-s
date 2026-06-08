"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Eye, Download } from "lucide-react";
import type { StatutDemande } from "@/lib/database.types";

interface Demande {
  id: string;
  employe_id: string;
  employe_nom: string;
  employe_prenom: string;
  employe_email: string;
  type_nom: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: StatutDemande;
  motif: string | null;
  soumis_le: string;
}

const STATUTS: { label: string; valeur: StatutDemande | "tous" }[] = [
  { label: "Toutes",     valeur: "tous" },
  { label: "En attente", valeur: "en_attente" },
  { label: "Approuvées", valeur: "approuve" },
  { label: "Refusées",   valeur: "refuse" },
];

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = ["toutes", String(ANNEE_COURANTE - 1), String(ANNEE_COURANTE), String(ANNEE_COURANTE + 1)];

function exportCSV(demandes: Demande[]) {
  const entetes = ["Employé", "Email", "Type", "Date début", "Date fin", "Jours", "Statut", "Soumis le", "Motif"];
  const lignes = demandes.map((d) => [
    `${d.employe_prenom} ${d.employe_nom}`,
    d.employe_email,
    d.type_nom,
    d.date_debut,
    d.date_fin,
    String(d.nb_jours),
    d.statut,
    d.soumis_le.split("T")[0],
    d.motif ?? "",
  ]);

  const contenu = [entetes, ...lignes]
    .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `demandes-conge-${new Date().toISOString().split("T")[0]}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
}

export function TableauDemandes() {
  const [demandes, setDemandes]     = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [traitement, setTraitement] = useState<string | null>(null);
  const [erreur, setErreur]         = useState<string | null>(null);

  // Filtres
  const [filtreStatut,   setFiltreStatut]   = useState<StatutDemande | "tous">("tous");
  const [filtreEmploye,  setFiltreEmploye]  = useState("tous");
  const [filtreType,     setFiltreType]     = useState("tous");
  const [filtreAnnee,    setFiltreAnnee]    = useState(String(ANNEE_COURANTE));

  const charger = async () => {
    setErreur(null);
    const { data, error } = await supabase
      .from("demandes_conge")
      .select(`
        id, employe_id, date_debut, date_fin, nb_jours, statut, motif, soumis_le,
        employes!employe_id ( nom, prenom, email ),
        types_conge ( nom )
      `)
      .order("soumis_le", { ascending: false });

    if (error) {
      setErreur(`${error.code} — ${error.message}`);
      setChargement(false);
      return;
    }

    setDemandes(
      (data ?? []).map((d: any) => ({
        id:             d.id,
        employe_id:     d.employe_id,
        employe_nom:    d.employes?.nom    ?? "—",
        employe_prenom: d.employes?.prenom ?? "",
        employe_email:  d.employes?.email  ?? "—",
        type_nom:       d.types_conge?.nom ?? "—",
        date_debut:     d.date_debut,
        date_fin:       d.date_fin,
        nb_jours:       d.nb_jours,
        statut:         d.statut,
        motif:          d.motif,
        soumis_le:      d.soumis_le,
      }))
    );
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  /* ——— Options dynamiques pour les dropdowns ——— */
  const optionsEmployes = useMemo(() => {
    const noms = new Map<string, string>();
    demandes.forEach((d) => noms.set(d.employe_id, `${d.employe_prenom} ${d.employe_nom}`));
    return [{ value: "tous", label: "Tous les employés" },
      ...[...noms.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([v, l]) => ({ value: v, label: l }))];
  }, [demandes]);

  const optionsTypes = useMemo(() => {
    const types = [...new Set(demandes.map((d) => d.type_nom))].sort();
    return [{ value: "tous", label: "Tous les types" }, ...types.map((t) => ({ value: t, label: t }))];
  }, [demandes]);

  /* ——— Application des filtres ——— */
  const demandesFiltrees = useMemo(() => {
    return demandes.filter((d) => {
      if (filtreStatut  !== "tous" && d.statut      !== filtreStatut)  return false;
      if (filtreEmploye !== "tous" && d.employe_id  !== filtreEmploye) return false;
      if (filtreType    !== "tous" && d.type_nom    !== filtreType)    return false;
      if (filtreAnnee   !== "toutes") {
        const annee = new Date(d.date_debut).getFullYear();
        if (annee !== Number(filtreAnnee)) return false;
      }
      return true;
    });
  }, [demandes, filtreStatut, filtreEmploye, filtreType, filtreAnnee]);

  /* ——— Actions ——— */
  const changer = async (id: string, statut: StatutDemande) => {
    setTraitement(id);
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/valider-demande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: id, action: statut, validateur_id: user?.id }),
    });
    if (res.ok) {
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, statut } : d));
    } else {
      const err = await res.json().catch(() => ({}));
      setErreur(`Impossible de traiter : ${err.error ?? "erreur inconnue"}`);
    }
    setTraitement(null);
  };

  /* ——— Render ——— */
  return (
    <Card>
      <CardHeader>
        {/* Ligne 1 : titre + filtres statut */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>
            Toutes les demandes
            {demandesFiltrees.length !== demandes.length && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({demandesFiltrees.length} / {demandes.length})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUTS.map((f) => (
              <button
                key={f.valeur}
                onClick={() => setFiltreStatut(f.valeur)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtreStatut === f.valeur
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ligne 2 : filtres avancés + export */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {/* Année */}
          <select
            value={filtreAnnee}
            onChange={(e) => setFiltreAnnee(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ANNEES.map((a) => (
              <option key={a} value={a}>{a === "toutes" ? "Toutes les années" : a}</option>
            ))}
          </select>

          {/* Employé */}
          <select
            value={filtreEmploye}
            onChange={(e) => setFiltreEmploye(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {optionsEmployes.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Type */}
          <select
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {optionsTypes.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Réinitialiser (si filtres actifs) */}
          {(filtreStatut !== "tous" || filtreEmploye !== "tous" || filtreType !== "tous" || filtreAnnee !== String(ANNEE_COURANTE)) && (
            <button
              onClick={() => { setFiltreStatut("tous"); setFiltreEmploye("tous"); setFiltreType("tous"); setFiltreAnnee(String(ANNEE_COURANTE)); }}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Réinitialiser
            </button>
          )}

          <div className="flex-1" />

          {/* Export CSV */}
          <button
            onClick={() => exportCSV(demandesFiltrees)}
            disabled={demandesFiltrees.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </button>
        </div>

        {erreur && (
          <p className="text-sm text-red-500 mt-1">{erreur}</p>
        )}
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
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{d.employe_prenom} {d.employe_nom}</p>
                      <p className="text-xs text-gray-400">{d.employe_email}</p>
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
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                              title="Approuver"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => changer(d.id, "refuse")}
                              disabled={traitement === d.id}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
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
