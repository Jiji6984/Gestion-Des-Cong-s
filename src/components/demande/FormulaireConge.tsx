"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

const typesConge = [
  { value: "", label: "Sélectionnez un type" },
  { value: "annuel", label: "Congés annuels" },
  { value: "rtt", label: "RTT" },
  { value: "maladie", label: "Congé maladie" },
  { value: "sans_solde", label: "Sans solde" },
  { value: "maternite", label: "Congé maternité / paternité" },
  { value: "familial", label: "Événement familial" },
];

export function FormulaireConge() {
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({
    type: "",
    dateDebut: "",
    dateFin: "",
    motif: "",
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const valider = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = "Veuillez sélectionner un type.";
    if (!form.dateDebut) e.dateDebut = "La date de début est requise.";
    if (!form.dateFin) e.dateFin = "La date de fin est requise.";
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut)
      e.dateFin = "La date de fin doit être après la date de début.";
    return e;
  };

  const calculerJours = () => {
    if (!form.dateDebut || !form.dateFin) return 0;
    const debut = new Date(form.dateDebut);
    const fin = new Date(form.dateFin);
    let jours = 0;
    const current = new Date(debut);
    while (current <= fin) {
      const jour = current.getDay();
      if (jour !== 0 && jour !== 6) jours++;
      current.setDate(current.getDate() + 1);
    }
    return jours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2 = valider();
    if (Object.keys(e2).length > 0) {
      setErreurs(e2);
      return;
    }
    setErreurs({});
    setChargement(true);
    // TODO: soumettre via Supabase
    await new Promise((r) => setTimeout(r, 1200));
    setChargement(false);
    setEnvoye(true);
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
          <Button variant="secondary" onClick={() => { setEnvoye(false); setForm({ type: "", dateDebut: "", dateFin: "", motif: "" }); }}>
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
            options={typesConge}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            error={erreurs.type}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="dateDebut"
              type="date"
              label="Date de début"
              value={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              error={erreurs.dateDebut}
            />
            <Input
              id="dateFin"
              type="date"
              label="Date de fin"
              value={form.dateFin}
              min={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              error={erreurs.dateFin}
            />
          </div>

          {nbJours > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-sm text-blue-700 font-medium">
                Durée estimée : <span className="font-bold">{nbJours} jour{nbJours > 1 ? "s" : ""} ouvré{nbJours > 1 ? "s" : ""}</span>
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

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={chargement} className="flex-1">
              Soumettre la demande
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm({ type: "", dateDebut: "", dateFin: "", motif: "" })}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
