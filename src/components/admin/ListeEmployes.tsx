"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { UserPlus, Pencil, X } from "lucide-react";

type Role = "employe" | "manager" | "admin";

interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  departement: string | null;
  manager_id: string | null;
  manager_nom: string | null;
}

interface FormData {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
  departement: string;
  manager_id: string;
}

const roleBadge: Record<Role, { label: string; style: string }> = {
  admin:   { label: "Admin RH", style: "bg-purple-50 text-purple-700 ring-purple-200" },
  manager: { label: "Manager",  style: "bg-blue-50 text-blue-700 ring-blue-200" },
  employe: { label: "Employé",  style: "bg-gray-50 text-gray-600 ring-gray-200" },
};

const optionsRole = [
  { value: "employe", label: "Employé" },
  { value: "manager", label: "Manager" },
  { value: "admin",   label: "Admin RH" },
];

const FORM_VIDE: FormData = {
  prenom: "", nom: "", email: "", motDePasse: "",
  role: "employe", departement: "", manager_id: "",
};

export function ListeEmployes() {
  const [employes, setEmployes]       = useState<Employe[]>([]);
  const [chargement, setChargement]   = useState(true);
  const [recherche, setRecherche]     = useState("");

  // Modal
  const [modal, setModal]             = useState<"create" | "edit" | null>(null);
  const [employeEdite, setEmployeEdite] = useState<Employe | null>(null);
  const [form, setForm]               = useState<FormData>(FORM_VIDE);
  const [enregistrement, setEnreg]    = useState(false);
  const [erreurForm, setErreurForm]   = useState<string | null>(null);

  /* ——— Chargement ——— */
  const charger = async () => {
    setChargement(true);
    const { data } = await supabase
      .from("employes")
      .select("id, nom, prenom, email, role, departement, manager_id")
      .order("nom");

    const rows = data ?? [];
    // Résoudre les noms de managers en JS (évite les problèmes de self-join PostgREST)
    const byId = Object.fromEntries(rows.map((e: any) => [e.id, e]));

    setEmployes(
      rows.map((e: any) => {
        const mgr = e.manager_id ? byId[e.manager_id] : null;
        return {
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          email: e.email,
          role: e.role,
          departement: e.departement,
          manager_id: e.manager_id,
          manager_nom: mgr ? `${mgr.prenom} ${mgr.nom}` : null,
        };
      })
    );
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  /* ——— Ouverture des modals ——— */
  const ouvrirCreation = () => {
    setForm(FORM_VIDE);
    setErreurForm(null);
    setEmployeEdite(null);
    setModal("create");
  };

  const ouvrirEdition = (e: Employe) => {
    setForm({
      prenom: e.prenom,
      nom: e.nom,
      email: e.email,
      motDePasse: "",
      role: e.role,
      departement: e.departement ?? "",
      manager_id: e.manager_id ?? "",
    });
    setErreurForm(null);
    setEmployeEdite(e);
    setModal("edit");
  };

  const fermer = () => { setModal(null); setEmployeEdite(null); };

  /* ——— Helper setter ——— */
  const setField = (key: keyof FormData) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: ev.target.value }));

  /* ——— Créer un employé ——— */
  const creer = async () => {
    if (!form.prenom || !form.nom || !form.email) {
      setErreurForm("Prénom, nom et email sont requis.");
      return;
    }
    setEnreg(true);
    setErreurForm(null);

    const res = await fetch("/api/employes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      await charger();
      fermer();
    } else {
      const err = await res.json().catch(() => ({}));
      setErreurForm(err.error ?? "Erreur lors de la création.");
    }
    setEnreg(false);
  };

  /* ——— Modifier un employé ——— */
  const modifier = async () => {
    if (!employeEdite || !form.prenom || !form.nom) {
      setErreurForm("Prénom et nom sont requis.");
      return;
    }
    setEnreg(true);
    setErreurForm(null);

    const { error } = await supabase
      .from("employes")
      .update({
        prenom:      form.prenom,
        nom:         form.nom,
        role:        form.role,
        departement: form.departement || null,
        manager_id:  form.manager_id  || null,
        mis_a_jour_le: new Date().toISOString(),
      })
      .eq("id", employeEdite.id);

    if (!error) {
      await charger();
      fermer();
    } else {
      setErreurForm("Erreur lors de la modification.");
    }
    setEnreg(false);
  };

  /* ——— Filtrage ——— */
  const filtres = employes.filter((e) => {
    const q = recherche.toLowerCase();
    return (
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.departement ?? "").toLowerCase().includes(q)
    );
  });

  const optionsManagers = [
    { value: "", label: "Aucun manager" },
    ...employes
      .filter((e) => (e.role === "manager" || e.role === "admin") && e.id !== employeEdite?.id)
      .map((m) => ({ value: m.id, label: `${m.prenom} ${m.nom}` })),
  ];

  /* ——— Render ——— */
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Tous les employés ({employes.length})</CardTitle>
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Rechercher…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
              <Button size="sm" onClick={ouvrirCreation}>
                <UserPlus className="h-4 w-4" />
                Ajouter
              </Button>
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
                    {["Employé", "Email", "Département", "Manager", "Rôle", ""].map((col) => (
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => ouvrirEdition(e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtres.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
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

      {/* ——— Modal ——— */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={fermer}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {modal === "create" ? "Ajouter un employé" : `Modifier — ${employeEdite?.prenom} ${employeEdite?.nom}`}
              </h2>
              <button
                onClick={fermer}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="prenom"
                  label="Prénom"
                  value={form.prenom}
                  onChange={setField("prenom")}
                  placeholder="Marie"
                />
                <Input
                  id="nom"
                  label="Nom"
                  value={form.nom}
                  onChange={setField("nom")}
                  placeholder="Dupont"
                />
              </div>

              <Input
                id="email"
                type="email"
                label="Email"
                value={form.email}
                onChange={setField("email")}
                disabled={modal === "edit"}
                placeholder="marie.dupont@exemple.fr"
                className={modal === "edit" ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}
              />

              {modal === "create" && (
                <Input
                  id="motDePasse"
                  type="password"
                  label="Mot de passe initial"
                  placeholder="Min. 8 caractères"
                  value={form.motDePasse}
                  onChange={setField("motDePasse")}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="role"
                  label="Rôle"
                  options={optionsRole}
                  value={form.role}
                  onChange={setField("role")}
                />
                <Input
                  id="departement"
                  label="Département"
                  placeholder="ex : Développement"
                  value={form.departement}
                  onChange={setField("departement")}
                />
              </div>

              <Select
                id="manager_id"
                label="Manager"
                options={optionsManagers}
                value={form.manager_id}
                onChange={setField("manager_id")}
              />

              {erreurForm && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-600">{erreurForm}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Button variant="secondary" onClick={fermer}>
                Annuler
              </Button>
              <Button
                loading={enregistrement}
                onClick={modal === "create" ? creer : modifier}
              >
                {modal === "create" ? "Créer l'employé" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
