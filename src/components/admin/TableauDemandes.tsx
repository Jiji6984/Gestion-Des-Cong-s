"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X, Eye } from "lucide-react";

type Statut = "en_attente" | "approuve" | "refuse" | "annule";

interface Demande {
  id: string;
  employe: string;
  email: string;
  type: string;
  dateDebut: Date;
  dateFin: Date;
  nbJours: number;
  statut: Statut;
  motif: string;
  soumisLe: Date;
}

const demandesInitiales: Demande[] = [
  {
    id: "1", employe: "Marie Dupont", email: "marie.dupont@example.fr",
    type: "Congés annuels", dateDebut: new Date("2025-08-18"), dateFin: new Date("2025-08-22"),
    nbJours: 5, statut: "en_attente", motif: "", soumisLe: new Date("2025-07-20"),
  },
  {
    id: "2", employe: "Thomas Martin", email: "t.martin@example.fr",
    type: "RTT", dateDebut: new Date("2025-08-01"), dateFin: new Date("2025-08-01"),
    nbJours: 1, statut: "en_attente", motif: "Rendez-vous médical", soumisLe: new Date("2025-07-18"),
  },
  {
    id: "3", employe: "Sophie Bernard", email: "s.bernard@example.fr",
    type: "Congés annuels", dateDebut: new Date("2025-09-01"), dateFin: new Date("2025-09-12"),
    nbJours: 10, statut: "en_attente", motif: "Vacances été", soumisLe: new Date("2025-07-15"),
  },
  {
    id: "4", employe: "Julien Petit", email: "j.petit@example.fr",
    type: "Congé maladie", dateDebut: new Date("2025-07-10"), dateFin: new Date("2025-07-11"),
    nbJours: 2, statut: "approuve", motif: "", soumisLe: new Date("2025-07-10"),
  },
  {
    id: "5", employe: "Claire Rousseau", email: "c.rousseau@example.fr",
    type: "RTT", dateDebut: new Date("2025-07-25"), dateFin: new Date("2025-07-25"),
    nbJours: 1, statut: "refuse", motif: "", soumisLe: new Date("2025-07-12"),
  },
];

const filtres: { label: string; valeur: Statut | "tous" }[] = [
  { label: "Toutes", valeur: "tous" },
  { label: "En attente", valeur: "en_attente" },
  { label: "Approuvées", valeur: "approuve" },
  { label: "Refusées", valeur: "refuse" },
];

export function TableauDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>(demandesInitiales);
  const [filtre, setFiltre] = useState<Statut | "tous">("tous");

  const changer = (id: string, statut: Statut) => {
    setDemandes((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
  };

  const demandesFiltrees = filtre === "tous" ? demandes : demandes.filter((d) => d.statut === filtre);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Toutes les demandes</CardTitle>
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
                    <div>
                      <p className="font-medium text-gray-900">{d.employe}</p>
                      <p className="text-xs text-gray-400">{d.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{d.type}</td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {format(d.dateDebut, "d MMM", { locale: fr })}
                    {d.dateDebut.toDateString() !== d.dateFin.toDateString() && (
                      <> → {format(d.dateFin, "d MMM yyyy", { locale: fr })}</>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {d.nbJours}j
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {format(d.soumisLe, "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge statut={d.statut} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {d.statut === "en_attente" && (
                        <>
                          <button
                            onClick={() => changer(d.id, "approuve")}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Approuver"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => changer(d.id, "refuse")}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Refuser"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                        title="Voir le détail"
                      >
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
      </CardContent>
    </Card>
  );
}
