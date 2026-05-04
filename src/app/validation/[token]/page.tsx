"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PageState = "initial" | "approuve" | "refuse" | "invalide";

const demandeMock = {
  employe: "Marie Dupont",
  email: "marie.dupont@example.fr",
  type: "Congés annuels",
  dateDebut: new Date("2025-08-18"),
  dateFin: new Date("2025-08-22"),
  nbJours: 5,
  motif: "Vacances en famille",
  soumisLe: new Date("2025-07-20"),
};

export default function ValidationPage({ params }: { params: { token: string } }) {
  const [etat, setEtat] = useState<PageState>("initial");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState<"approuve" | "refuse" | null>(null);

  const tokenValide = params.token && params.token.length > 8;

  if (!tokenValide) {
    return <PageInvalide />;
  }

  const traiter = async (action: "approuve" | "refuse") => {
    setChargement(action);
    // TODO: appel Supabase avec le token
    await new Promise((r) => setTimeout(r, 1200));
    setChargement(null);
    setEtat(action);
  };

  if (etat === "approuve" || etat === "refuse") {
    return <PageConfirmation statut={etat} employe={demandeMock.employe} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Validation de congé</h1>
            <p className="text-xs text-gray-400">Gestion des Congés</p>
          </div>
        </div>

        {/* Fiche demande */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Détails de la demande</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">{demandeMock.employe}</p>
                <p className="text-sm text-gray-500">{demandeMock.email}</p>
              </div>
              <Badge statut="en_attente" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Type de congé</p>
                <p className="font-medium text-gray-800">{demandeMock.type}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Durée</p>
                <p className="font-medium text-gray-800">{demandeMock.nbJours} jours ouvrés</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Date de début</p>
                <p className="font-medium text-gray-800">
                  {format(demandeMock.dateDebut, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Date de fin</p>
                <p className="font-medium text-gray-800">
                  {format(demandeMock.dateFin, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            {demandeMock.motif && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Motif</p>
                <p className="text-sm text-gray-700">{demandeMock.motif}</p>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Demande soumise le {format(demandeMock.soumisLe, "d MMMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>

        {/* Commentaire */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 mb-4">
          <Textarea
            label="Commentaire (optionnel)"
            placeholder="Ajoutez un commentaire qui sera transmis à l'employé..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => traiter("refuse")}
            loading={chargement === "refuse"}
            disabled={chargement !== null}
          >
            <XCircle className="h-4 w-4" />
            Refuser
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => traiter("approuve")}
            loading={chargement === "approuve"}
            disabled={chargement !== null}
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
            : <XCircle className="h-8 w-8 text-red-500" />
          }
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Demande {approuve ? "approuvée" : "refusée"}
        </h2>
        <p className="text-sm text-gray-500">
          {approuve
            ? `La demande de ${employe} a été approuvée. Un e-mail de confirmation lui a été envoyé.`
            : `La demande de ${employe} a été refusée. Un e-mail de notification lui a été envoyé.`
          }
        </p>
      </div>
    </div>
  );
}

function PageInvalide() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500">
          Ce lien de validation est invalide ou a déjà été utilisé. Veuillez contacter votre administrateur RH.
        </p>
      </div>
    </div>
  );
}
