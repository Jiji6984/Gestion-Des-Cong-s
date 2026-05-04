"use client";

import { useState, useEffect } from "react";
import { CalendarCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { StatutDemande } from "@/lib/database.types";

interface Demande {
  id: string;
  employe_prenom: string;
  employe_nom: string;
  employe_email: string;
  type_nom: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  motif: string | null;
  soumis_le: string;
  statut: StatutDemande;
}

type PageState = "chargement" | "initial" | "approuve" | "refuse" | "invalide" | "deja_traite";

export default function ValidationPage({ params }: { params: { token: string } }) {
  const [etat, setEtat] = useState<PageState>("chargement");
  const [demande, setDemande] = useState<Demande | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [traitement, setTraitement] = useState<"approuve" | "refuse" | null>(null);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("demandes_conge")
        .select(`
          id, date_debut, date_fin, nb_jours, motif, soumis_le, statut,
          employes ( nom, prenom, email ),
          types_conge ( nom )
        `)
        .eq("token_validation", params.token)
        .single();

      if (!data) { setEtat("invalide"); return; }

      if (data.statut !== "en_attente") { setEtat("deja_traite"); return; }

      setDemande({
        id: data.id,
        employe_prenom: (data.employes as any)?.prenom ?? "—",
        employe_nom: (data.employes as any)?.nom ?? "—",
        employe_email: (data.employes as any)?.email ?? "—",
        type_nom: (data.types_conge as any)?.nom ?? "—",
        date_debut: data.date_debut,
        date_fin: data.date_fin,
        nb_jours: data.nb_jours,
        motif: data.motif,
        soumis_le: data.soumis_le,
        statut: data.statut,
      });
      setEtat("initial");
    };
    charger();
  }, [params.token]);

  const traiter = async (action: "approuve" | "refuse") => {
    if (!demande) return;
    setTraitement(action);

    await supabase
      .from("demandes_conge")
      .update({
        statut: action,
        commentaire_validateur: commentaire || null,
      })
      .eq("id", demande.id);

    setTraitement(null);
    setEtat(action);
  };

  if (etat === "chargement") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (etat === "invalide") return <PageErreur type="invalide" />;
  if (etat === "deja_traite") return <PageErreur type="deja_traite" />;
  if (etat === "approuve" || etat === "refuse") {
    return <PageConfirmation statut={etat} employe={`${demande?.employe_prenom} ${demande?.employe_nom}`} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Validation de congé</h1>
            <p className="text-xs text-gray-400">Gestion des Congés</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Détails de la demande</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {demande?.employe_prenom} {demande?.employe_nom}
                </p>
                <p className="text-sm text-gray-500">{demande?.employe_email}</p>
              </div>
              <Badge statut="en_attente" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Type de congé</p>
                <p className="font-medium text-gray-800">{demande?.type_nom}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Durée</p>
                <p className="font-medium text-gray-800">{demande?.nb_jours} jours ouvrés</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Date de début</p>
                <p className="font-medium text-gray-800">
                  {demande && format(new Date(demande.date_debut), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Date de fin</p>
                <p className="font-medium text-gray-800">
                  {demande && format(new Date(demande.date_fin), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            {demande?.motif && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Motif</p>
                <p className="text-sm text-gray-700">{demande.motif}</p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Soumise le{" "}
              {demande && format(new Date(demande.soumis_le), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 mb-4">
          <Textarea
            label="Commentaire (optionnel)"
            placeholder="Ajoutez un commentaire qui sera transmis à l'employé..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => traiter("refuse")}
            loading={traitement === "refuse"}
            disabled={traitement !== null}
          >
            <XCircle className="h-4 w-4" />
            Refuser
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => traiter("approuve")}
            loading={traitement === "approuve"}
            disabled={traitement !== null}
          >
            <CheckCircle className="h-4 w-4" />
            Approuver
          </Button>
        </div>
      </div>
    </div>
  );
}

function PageConfirmation({ statut, employe }: { statut: "approuve" | "refuse"; employe: string }) {
  const approuve = statut === "approuve";
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${approuve ? "bg-green-100" : "bg-red-100"}`}>
          {approuve
            ? <CheckCircle className="h-8 w-8 text-green-600" />
            : <XCircle className="h-8 w-8 text-red-500" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Demande {approuve ? "approuvée" : "refusée"}
        </h2>
        <p className="text-sm text-gray-500">
          {approuve
            ? `La demande de ${employe} a été approuvée. Un e-mail de confirmation lui a été envoyé.`
            : `La demande de ${employe} a été refusée. Un e-mail de notification lui a été envoyé.`}
        </p>
      </div>
    </div>
  );
}

function PageErreur({ type }: { type: "invalide" | "deja_traite" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {type === "invalide" ? "Lien invalide" : "Déjà traitée"}
        </h2>
        <p className="text-sm text-gray-500">
          {type === "invalide"
            ? "Ce lien de validation est invalide ou a expiré. Contactez votre administrateur RH."
            : "Cette demande a déjà été traitée. Aucune action supplémentaire n'est nécessaire."}
        </p>
      </div>
    </div>
  );
}
