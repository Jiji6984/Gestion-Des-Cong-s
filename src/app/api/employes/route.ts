import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** POST /api/employes — Crée un employé (compte auth + ligne employes) */
export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const { prenom, nom, email, motDePasse, role, departement, manager_id } = await req.json();

  if (!prenom || !nom || !email) {
    return NextResponse.json({ error: "Prénom, nom et email sont requis." }, { status: 400 });
  }

  if (motDePasse && motDePasse.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const supabase = serviceClient();

  // 1. Créer le compte auth avec les métadonnées (le trigger creer_profil_employe
  //    utilisera raw_user_meta_data->>'nom' et 'prenom' pour créer la ligne employes)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: motDePasse || "MotDePasse@123",
    email_confirm: true,
    user_metadata: { nom, prenom },
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "Erreur lors de la création du compte.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 2. Le trigger a déjà créé la ligne employes avec nom/prenom/email.
  //    On met à jour uniquement les champs supplémentaires.
  const { error: empError } = await supabase
    .from("employes")
    .update({
      role:        role        || "employe",
      departement: departement || null,
      manager_id:  manager_id || null,
    })
    .eq("id", authData.user.id);

  if (empError) {
    // Rollback : supprimer le compte auth créé
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: empError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
