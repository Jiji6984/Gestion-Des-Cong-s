"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase";
import { CheckCircle } from "lucide-react";

interface TypeConge {
  id: string;
  nom: string;
  limite_jours: number | null;
}

export function FormulaireConge() {
  const [types, setTypes] = useState<TypeConge[]>([]);
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({ type_conge_id: "", date_debut: "", date_fin: "", motif: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("types_conge")
      .select("id, nom, limite_jours")
      .eq("actif", true)
      .order("nom")
      .then(({ data }) => setTypes(data ?? []));
  }, []);

  const options = [
    { value: "", label: "Sélectionnez un type" },
    ...types.map((t) => ({ value: t.id, label: t.nom })),
  ];

  const calculerJours = () => {
    if (!form.date_debut || !form.date_fin) return 0;
    const debut = new Date(form.date_debut);
    const fin = new Date(form.date_fin);
    let jours = 0;
    const cur = new Date(debut);
    while (cur <= fin) {
      const j = cur.getDay();
      if (j !== 0 && j !== 6) jours++;
      cur.setDate(cur.getDate() + 1);
    }
    return jours;
  };

  const valider = () => {
    const e: Record<string, string> = {};
    if (!form.type_conge_id) e.type_conge_id = "Veuillez sélectionner un type.";
    if (!form.date_debut) e.date_debut = "La date de début est requise.";
    if (!form.date_fin) e.date_fin = "La date de fin est requise.";
    if (form.date_debut && form.date_fin && form.date_fin < form.date_debut)
      e.date_fin = "La date de fin doit être après la date de début.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = valider();
    if (Object.keys(errs).length > 0) { setErreurs(errs); return; }
    setErreurs({});
    setChargement(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nb_jours = calculerJours();

    const { data: nouvelleDemande, error } = await supabase
      .from("demandes_conge")
      .insert({
        employe_id: user.id,
        type_conge_id: form.type_conge_id,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        nb_jours,
        motif: form.motif || null,
        statut: "en_attente",
        validateur_id: null,
      })
      .select("id")
      .single();

    if (error || !nouvelleDemande) {
      setChargement(false);
      setErreurs({ global: "Une erreur est survenue. Veuillez réessayer." });
      return;
    }

    // Notifier le manager par email (Level 1)
    await fetch("/api/notifier-validateur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demande_id: nouvelleDemande.id }),
    });

    setChargement(false);
    setEnvoye(true);
  };

  const reinitialiser = () => {
    setEnvoye(false);
    setForm({ type_conge_id: "", date_debut: "", date_fin: "", motif: "" });
  };

  if (envoye) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-sm text-gray-500 mb-6">
            Votre demande a bien été transmise. Vous recevrez une notification dès qu&apos;elle sera traitée.
          </p>
          <Button variant="secondary" onClick={reinitialiser}>
            Nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  const nbJours = calculerJours();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaire de demande</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            id="type"
            label="Type de congé"
            options={options}
            value={form.type_conge_id}
            onChange={(e) => setForm({ ...form, type_conge_id: e.target.value })}
            error={erreurs.type_conge_id}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="dateDebut"
              type="date"
              label="Date de début"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
              error={erreurs.date_debut}
            />
            <Input
              id="dateFin"
              type="date"
              label="Date de fin"
              value={form.date_fin}
              min={form.date_debut}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
              error={erreurs.date_fin}
            />
          </div>

          {nbJours > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-sm text-blue-700 font-medium">
                Durée estimée :{" "}
                <span className="font-bold">
                  {nbJours} jour{nbJours > 1 ? "s" : ""} ouvré{nbJours > 1 ? "s" : ""}
                </span>
              </p>
            </div>
          )}

          <Textarea
            id="motif"
            label="Motif (optionnel)"
            placeholder="Précisez le motif de votre demande si nécessaire..."
            value={form.motif}
            onChange={(e) => setForm({ ...form, motif: e.target.value })}
          />

          {erreurs.global && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <p className="text-sm text-red-600">{erreurs.global}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={chargement} className="flex-1">
              Soumettre la demande
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm({ type_conge_id: "", date_debut: "", date_fin: "", motif: "" })}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
