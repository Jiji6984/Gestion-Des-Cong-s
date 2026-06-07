"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";

type Role = "employe" | "manager" | "admin";

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  departement: string | null;
  manager_nom: string | null;
}

const roleBadge: Record<Role, { label: string; style: string }> = {
  admin:   { label: "Admin RH",  style: "bg-purple-50 text-purple-700 ring-purple-200" },
  manager: { label: "Manager",   style: "bg-blue-50 text-blue-700 ring-blue-200" },
  employe: { label: "Employé",   style: "bg-gray-50 text-gray-600 ring-gray-200" },
};

export function ListeEmployes() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("employes")
        .select(`
          id, nom, prenom, email, role, departement,
          managers:employes!manager_id ( nom, prenom )
        `)
        .order("nom");

      const mapped = (data ?? []).map((e: any) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
        role: e.role,
        departement: e.departement,
        manager_nom: e.managers ? `${e.managers.prenom} ${e.managers.nom}` : null,
      }));

      setEmployes(mapped);
      setChargement(false);
    };
    charger();
  }, []);

  const filtres = employes.filter((e) => {
    const q = recherche.toLowerCase();
    return (
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.departement ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle>Tous les employés ({employes.length})</CardTitle>
          <input
            type="search"
            placeholder="Rechercher…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
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
                  {["Employé", "Email", "Département", "Manager", "Rôle"].map((col) => (
                    <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtres.map((e) => {
                  const badge = roleBadge[e.role];
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                            {e.prenom.charAt(0)}{e.nom.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{e.prenom} {e.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{e.email}</td>
                      <td className="px-6 py-4 text-gray-600">{e.departement ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{e.manager_nom ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtres.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      Aucun employé trouvé.
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
