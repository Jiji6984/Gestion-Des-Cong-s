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

  const { demande_id } = await req.json();

  if (!demande_id) {
    return NextResponse.json({ error: "demande_id manquant" }, { status: 400 });
  }

  // Récupérer la demande + token de validation
  const { data: demande, error: errDemande } = await supabase
    .from("demandes_conge")
    .select(`
      id, date_debut, date_fin, nb_jours, motif, soumis_le, token_validation,
      employes!employe_id ( id, nom, prenom, email, manager_id ),
      types_conge ( nom )
    `)
    .eq("id", demande_id)
    .single();

  if (errDemande || !demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const employe  = demande.employes as any;
  const typeConge = demande.types_conge as any;

  // Récupérer le validateur : manager direct ou, à défaut, tous les admins
  let validateurs: { nom: string; prenom: string; email: string }[] = [];

  if (employe?.manager_id) {
    const { data: mgr } = await supabase
      .from("employes")
      .select("nom, prenom, email")
      .eq("id", employe.manager_id)
      .single();
    if (mgr) validateurs = [mgr];
  }

  if (validateurs.length === 0) {
    // Pas de manager → notifier tous les admins
    const { data: admins } = await supabase
      .from("employes")
      .select("nom, prenom, email")
      .eq("role", "admin");
    validateurs = admins ?? [];
  }

  if (validateurs.length === 0) {
    return NextResponse.json(
      { error: "Aucun validateur trouvé (ni manager, ni admin)" },
      { status: 422 }
    );
  }

  const dateDebut  = format(new Date(demande.date_debut), "EEEE d MMMM yyyy", { locale: fr });
  const dateFin    = format(new Date(demande.date_fin),   "EEEE d MMMM yyyy", { locale: fr });
  const soumisLe   = format(new Date(demande.soumis_le),  "d MMMM yyyy à HH:mm", { locale: fr });
  const nomEmploye = `${employe.prenom} ${employe.nom}`;

  // Construire l'URL de validation
  const origin = new URL(req.url).origin;
  const urlValidation = `${origin}/validation/${demande.token_validation}`;

  // Envoyer à chaque validateur
  const resultats = await Promise.allSettled(
    validateurs.map((v) =>
      resend.emails.send({
        from: "Gestion des Congés <onboarding@resend.dev>",
        to: [v.email],
        subject: `Nouvelle demande de congé — ${nomEmploye}`,
        html: emailTemplate({
          nomManager: `${v.prenom} ${v.nom}`,
          nomEmploye,
          emailEmploye: employe.email,
          typeConge: typeConge.nom,
          dateDebut,
          dateFin,
          nbJours: demande.nb_jours,
          motif: demande.motif,
          soumisLe,
          urlValidation,
        }),
      })
    )
  );

  const echecs = resultats.filter((r) => r.status === "rejected");
  if (echecs.length > 0) console.error("Erreurs Resend:", echecs);

  return NextResponse.json({ success: true, envoyes: resultats.length - echecs.length });
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
  urlValidation: string;
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
                Une nouvelle demande de congé vient d'être soumise par <strong style="color:#111827;">${data.nomEmploye}</strong> et nécessite votre validation.
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

              <!-- Bouton de validation -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.urlValidation}"
                       style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
                      Traiter la demande →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Ou copiez ce lien dans votre navigateur :<br/>
                <a href="${data.urlValidation}" style="color:#2563eb;word-break:break-all;">${data.urlValidation}</a>
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
