"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, X, Infinity } from "lucide-react";

interface TypeConge {
  id: string;
  nom: string;
  couleur: string;
  limite_jours: number | null;
  actif: boolean;
}

interface FormData {
  nom: string;
  couleur: string;
  limite_jours: string;
  actif: boolean;
}

const FORM_VIDE: FormData = { nom: "", couleur: "#3b82f6", limite_jours: "", actif: true };

export function GestionTypesConge() {
  const [types, setTypes]           = useState<TypeConge[]>([]);
  const [chargement, setCharge]     = useState(true);
  const [modal, setModal]           = useState<"create" | "edit" | null>(null);
  const [typeEdite, setTypeEdite]   = useState<TypeConge | null>(null);
  const [form, setForm]             = useState<FormData>(FORM_VIDE);
  const [saving, setSaving]         = useState(false);
  const [erreur, setErreur]         = useState<string | null>(null);

  const charger = async () => {
    setCharge(true);
    const { data } = await supabase
      .from("types_conge")
      .select("id, nom, couleur, limite_jours, actif")
      .order("nom");
    setTypes(data ?? []);
    setCharge(false);
  };

  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => {
    setForm(FORM_VIDE);
    setErreur(null);
    setTypeEdite(null);
    setModal("create");
  };

  const ouvrirEdition = (t: TypeConge) => {
    setForm({
      nom:          t.nom,
      couleur:      t.couleur,
      limite_jours: t.limite_jours !== null ? String(t.limite_jours) : "",
      actif:        t.actif,
    });
    setErreur(null);
    setTypeEdite(t);
    setModal("edit");
  };

  const fermer = () => { setModal(null); setTypeEdite(null); };

  const sauvegarder = async () => {
    if (!form.nom.trim()) { setErreur("Le nom est requis."); return; }
    setSaving(true);
    setErreur(null);

    const payload = {
      ...(typeEdite ? { id: typeEdite.id } : {}),
      nom:          form.nom,
      couleur:      form.couleur,
      limite_jours: form.limite_jours ? Number(form.limite_jours) : null,
      actif:        form.actif,
    };

    const res = await fetch("/api/types-conge", {
      method: modal === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await charger();
      fermer();
    } else {
      const err = await res.json().catch(() => ({}));
      setErreur(err.error ?? "Erreur lors de la sauvegarde.");
    }
    setSaving(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Types de congés ({types.length})</CardTitle>
            <Button size="sm" onClick={ouvrirCreation}>
              <Plus className="h-4 w-4" />
              Nouveau type
            </Button>
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
                    {["Type", "Limite", "Statut", ""].map((col) => (
                      <th key={col} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {types.map((t) => (
                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.actif ? "opacity-50" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.couleur }}
                          />
                          <span className="font-medium text-gray-900">{t.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {t.limite_jours !== null ? (
                          <span>{t.limite_jours} jours / an</span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Infinity className="h-3.5 w-3.5" /> Illimité
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          t.actif
                            ? "bg-green-50 text-green-700 ring-green-200"
                            : "bg-gray-50 text-gray-500 ring-gray-200"
                        }`}>
                          {t.actif ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => ouvrirEdition(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {types.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                        Aucun type de congé.
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={fermer} />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {modal === "create" ? "Nouveau type de congé" : `Modifier — ${typeEdite?.nom}`}
              </h2>
              <button onClick={fermer} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <Input
                id="nom"
                label="Nom"
                placeholder="ex : Congé enfant malade"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />

              {/* Couleur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.couleur}
                    onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                    className="h-9 w-14 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-gray-500 font-mono">{form.couleur}</span>
                </div>
              </div>

              {/* Limite jours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Limite (jours / an)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    placeholder="Laisser vide = illimité"
                    value={form.limite_jours}
                    onChange={(e) => setForm({ ...form, limite_jours: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {!form.limite_jours && (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Infinity className="h-4 w-4" /> Illimité
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Laissez vide pour un type sans limite (maladie, maternité…)</p>
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, actif: !form.actif })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    form.actif ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.actif ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-sm text-gray-700">
                  {form.actif ? "Actif — visible dans le formulaire" : "Inactif — masqué du formulaire"}
                </span>
              </div>

              {erreur && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-600">{erreur}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Button variant="secondary" onClick={fermer}>Annuler</Button>
              <Button loading={saving} onClick={sauvegarder}>
                {modal === "create" ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
