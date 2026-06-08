"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X, User, Calendar, Clock, MessageSquare, CheckCircle } from "lucide-react";
import type { StatutDemande } from "@/lib/database.types";

interface Detail {
  id: string;
  employe_prenom: string;
  employe_nom: string;
  employe_email: string;
  type_nom: string;
  type_couleur: string;
  date_debut: string;
  date_fin: string;
  nb_jours: number;
  statut: StatutDemande;
  motif: string | null;
  soumis_le: string;
  traite_le: string | null;
  commentaire_validateur: string | null;
  validateur_prenom: string | null;
  validateur_nom: string | null;
}

interface Props {
  demandeId: string;
  onClose: () => void;
}

export function ModalDetailDemande({ demandeId, onClose }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [chargement, setCharge] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("demandes_conge")
        .select(`
          id, date_debut, date_fin, nb_jours, statut,
          motif, soumis_le, traite_le, commentaire_validateur,
          employes!employe_id ( prenom, nom, email ),
          validateur:employes!validateur_id ( prenom, nom ),
          types_conge!type_conge_id ( nom, couleur )
        `)
        .eq("id", demandeId)
        .single();

      if (data) {
        const emp = data.employes as any;
        const val = data.validateur as any;
        const type = data.types_conge as any;
        setDetail({
          id:                     data.id,
          employe_prenom:         emp?.prenom ?? "—",
          employe_nom:            emp?.nom ?? "—",
          employe_email:          emp?.email ?? "—",
          type_nom:               type?.nom ?? "—",
          type_couleur:           type?.couleur ?? "#6b7280",
          date_debut:             data.date_debut,
          date_fin:               data.date_fin,
          nb_jours:               data.nb_jours,
          statut:                 data.statut,
          motif:                  data.motif,
          soumis_le:              data.soumis_le,
          traite_le:              data.traite_le,
          commentaire_validateur: data.commentaire_validateur,
          validateur_prenom:      val?.prenom ?? null,
          validateur_nom:         val?.nom ?? null,
        });
      }
      setCharge(false);
    };
    charger();
  }, [demandeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Détail de la demande</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {chargement ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : !detail ? (
            <p className="text-sm text-gray-400 text-center py-6">Demande introuvable.</p>
          ) : (
            <div className="space-y-4">

              {/* Statut */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</span>
                <Badge statut={detail.statut} />
              </div>

              {/* Employé */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Employé</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{detail.employe_prenom} {detail.employe_nom}</p>
                <p className="text-xs text-gray-500">{detail.employe_email}</p>
              </div>

              {/* Type + période */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Congé</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: detail.type_couleur }} />
                  <span className="text-sm font-medium text-gray-900">{detail.type_nom}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Début</p>
                    <p className="font-medium text-gray-800">
                      {format(new Date(detail.date_debut), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Fin</p>
                    <p className="font-medium text-gray-800">
                      {format(new Date(detail.date_fin), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-600">
                    {detail.nb_jours} jour{detail.nb_jours > 1 ? "s" : ""} ouvré{detail.nb_jours > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Motif */}
              {detail.motif && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Motif</span>
                  </div>
                  <p className="text-sm text-gray-700">{detail.motif}</p>
                </div>
              )}

              {/* Traitement */}
              {detail.traite_le && (
                <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Traitement</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Traité le</span>
                    <span className="font-medium text-gray-800">
                      {format(new Date(detail.traite_le), "d MMM yyyy à HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {detail.validateur_prenom && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Par</span>
                      <span className="font-medium text-gray-800">
                        {detail.validateur_prenom} {detail.validateur_nom}
                      </span>
                    </div>
                  )}
                  {detail.commentaire_validateur && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400 mb-1">Commentaire</p>
                      <p className="text-sm text-gray-700 italic">"{detail.commentaire_validateur}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Soumis le */}
              <p className="text-xs text-gray-400 text-right">
                Soumis le {format(new Date(detail.soumis_le), "d MMM yyyy à HH:mm", { locale: fr })}
              </p>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
