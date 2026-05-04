import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { demande_id } = await req.json();

  if (!demande_id) {
    return NextResponse.json({ error: "demande_id manquant" }, { status: 400 });
  }

  // Récupérer la demande avec les infos de l'employé et du type de congé
  const { data: demande, error: errDemande } = await supabase
    .from("demandes_conge")
    .select(`
      id, date_debut, date_fin, nb_jours, motif, soumis_le,
      employes ( id, nom, prenom, email, manager_id ),
      types_conge ( nom )
    `)
    .eq("id", demande_id)
    .single();

  if (errDemande || !demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const employe = demande.employes as any;
  const typeConge = demande.types_conge as any;

  if (!employe?.manager_id) {
    return NextResponse.json(
      { error: "Aucun manager défini pour cet employé" },
      { status: 422 }
    );
  }

  // Récupérer l'email du manager
  const { data: manager, error: errManager } = await supabase
    .from("employes")
    .select("nom, prenom, email")
    .eq("id", employe.manager_id)
    .single();

  if (errManager || !manager) {
    return NextResponse.json({ error: "Manager introuvable" }, { status: 404 });
  }

  const dateDebut = format(new Date(demande.date_debut), "EEEE d MMMM yyyy", { locale: fr });
  const dateFin = format(new Date(demande.date_fin), "EEEE d MMMM yyyy", { locale: fr });
  const soumisLe = format(new Date(demande.soumis_le), "d MMMM yyyy à HH:mm", { locale: fr });
  const nomEmploye = `${employe.prenom} ${employe.nom}`;
  const nomManager = `${manager.prenom} ${manager.nom}`;

  const { error: errEmail } = await resend.emails.send({
    from: "Gestion des Congés <onboarding@resend.dev>",
    to: [manager.email],
    subject: `Nouvelle demande de congé — ${nomEmploye}`,
    html: emailTemplate({
      nomManager,
      nomEmploye,
      emailEmploye: employe.email,
      typeConge: typeConge.nom,
      dateDebut,
      dateFin,
      nbJours: demande.nb_jours,
      motif: demande.motif,
      soumisLe,
    }),
  });

  if (errEmail) {
    console.error("Erreur Resend:", errEmail);
    return NextResponse.json({ error: "Échec de l'envoi de l'email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function emailTemplate(data: {
  nomManager: string;
  nomEmploye: string;
  emailEmploye: string;
  typeConge: string;
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  motif: string | null;
  soumisLe: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle demande de congé</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:24px 32px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">
                📅 Gestion des Congés
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#111827;font-weight:600;">
                Bonjour ${data.nomManager},
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Une nouvelle demande de congé vient d'être soumise par <strong style="color:#111827;">${data.nomEmploye}</strong> et nécessite votre attention.
              </p>

              <!-- Fiche demande -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Employé</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.nomEmploye}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${data.emailEmploye}</p>
                  </td>
                </tr>
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
                  <td style="padding:16px 20px;${data.motif ? "border-bottom:1px solid #e5e7eb;" : ""}">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Durée</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:500;">${data.nbJours} jour${data.nbJours > 1 ? "s" : ""} ouvré${data.nbJours > 1 ? "s" : ""}</p>
                  </td>
                </tr>
                ${data.motif ? `
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;">Motif</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#111827;">${data.motif}</p>
                  </td>
                </tr>` : ""}
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Veuillez vous connecter à votre espace pour traiter cette demande.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Demande soumise le ${data.soumisLe} · Gestion des Congés
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
