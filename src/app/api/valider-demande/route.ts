import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = serviceClient();

  const { demande_id, action, commentaire, validateur_id } = await req.json();

  if (!demande_id || !action || !["approuve", "refuse"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // 1. Récupérer la demande
  const { data: demande, error: errDemande } = await supabase
    .from("demandes_conge")
    .select(`
      id, nb_jours, date_debut, date_fin, type_conge_id, statut,
      employes!employe_id ( id, nom, prenom, email ),
      types_conge ( nom )
    `)
    .eq("id", demande_id)
    .single();

  if (errDemande || !demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (demande.statut !== "en_attente") {
    return NextResponse.json({ error: "Demande déjà traitée" }, { status: 409 });
  }

  const employe = demande.employes as any;
  const typeConge = demande.types_conge as any;

  // 2. Mettre à jour le statut
  // Note : les triggers set_traite_le et mettre_a_jour_solde s'en chargent automatiquement
  const { error: errUpdate } = await supabase
    .from("demandes_conge")
    .update({
      statut: action,
      commentaire_validateur: commentaire || null,
      validateur_id: validateur_id || null,
    })
    .eq("id", demande_id);

  if (errUpdate) {
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }

  // 3. Envoyer un email à l'employé
  const dateDebut = format(new Date(demande.date_debut), "EEEE d MMMM yyyy", { locale: fr });
  const dateFin   = format(new Date(demande.date_fin),   "EEEE d MMMM yyyy", { locale: fr });

  await resend.emails.send({
    from: "Gestion des Congés <onboarding@resend.dev>",
    to: [employe.email],
    subject: action === "approuve"
      ? "✅ Votre demande de congé a été approuvée"
      : "❌ Votre demande de congé a été refusée",
    html: emailEmployeTemplate({
      nomEmploye: `${employe.prenom} ${employe.nom}`,
      typeConge: typeConge.nom,
      dateDebut,
      dateFin,
      nbJours: demande.nb_jours,
      statut: action,
      commentaire: commentaire || null,
    }),
  });

  return NextResponse.json({ success: true });
}

function emailEmployeTemplate(data: {
  nomEmploye: string;
  typeConge: string;
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  statut: "approuve" | "refuse";
  commentaire: string | null;
}) {
  const approuve = data.statut === "approuve";
  const couleur  = approuve ? "#16a34a" : "#dc2626";
  const icone    = approuve ? "✅" : "❌";
  const titre    = approuve ? "Demande approuvée" : "Demande refusée";
  const message  = approuve
    ? `Votre demande de congé a été <strong style="color:#16a34a;">approuvée</strong>. Bon repos !`
    : `Votre demande de congé a été <strong style="color:#dc2626;">refusée</strong>. Contactez votre responsable pour plus d'informations.`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${icone} ${titre}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:${couleur};padding:24px 32px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">
                📅 Gestion des Congés
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#111827;font-weight:600;">
                Bonjour ${data.nomEmploye},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                ${message}
              </p>

              <!-- Fiche demande -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Type de congé</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.typeConge}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%">
                          <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Date de début</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.dateDebut}</p>
                        </td>
                        <td width="50%">
                          <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Date de fin</p>
                          <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.dateFin}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;${data.commentaire ? "border-bottom:1px solid #e5e7eb;" : ""}">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Durée</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.nbJours} jour${data.nbJours > 1 ? "s" : ""} ouvré${data.nbJours > 1 ? "s" : ""}</p>
                  </td>
                </tr>
                ${data.commentaire ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Commentaire</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;">${data.commentaire}</p>
                  </td>
                </tr>` : ""}
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Connectez-vous à votre espace pour consulter l'historique de vos demandes.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Gestion des Congés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
