import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("demandes_conge")
    .select(`
      id, date_debut, date_fin, nb_jours, motif, soumis_le, statut,
      employes!employe_id ( nom, prenom, email ),
      types_conge ( nom )
    `)
    .eq("token_validation", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}
