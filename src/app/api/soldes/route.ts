import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** PUT — modifier le total d'un solde existant */
export async function PUT(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const { id, total } = await req.json();

  if (!id || total === undefined || total < 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const supabase = serviceClient();

  // Vérifier que total >= pris (contrainte DB)
  const { data: solde } = await supabase
    .from("soldes_conge")
    .select("pris")
    .eq("id", id)
    .single();

  if (solde && total < solde.pris) {
    return NextResponse.json(
      { error: `Le total (${total}j) ne peut pas être inférieur aux jours déjà pris (${solde.pris}j).` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("soldes_conge")
    .update({ total })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** POST — initialiser une année pour tous les employés */
export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });
  }

  const { annee } = await req.json();
  if (!annee || annee < 2020 || annee > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  const supabase = serviceClient();

  const [{ data: employes }, { data: types }] = await Promise.all([
    supabase.from("employes").select("id"),
    supabase
      .from("types_conge")
      .select("id, limite_jours")
      .not("limite_jours", "is", null)
      .eq("actif", true),
  ]);

  if (!employes?.length || !types?.length) {
    return NextResponse.json({ error: "Aucun employé ou type de congé trouvé" }, { status: 404 });
  }

  const rows = employes.flatMap((emp: any) =>
    types.map((type: any) => ({
      employe_id:    emp.id,
      type_conge_id: type.id,
      annee,
      total: type.limite_jours,
      pris:  0,
    }))
  );

  const { error } = await supabase
    .from("soldes_conge")
    .upsert(rows, { onConflict: "employe_id,type_conge_id,annee", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, lignes: rows.length });
}
