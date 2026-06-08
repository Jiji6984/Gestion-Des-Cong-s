import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** POST — créer un type de congé */
export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });

  const { nom, couleur, limite_jours, actif } = await req.json();

  if (!nom?.trim())
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("types_conge")
    .insert({
      nom: nom.trim(),
      couleur: couleur || "#3b82f6",
      limite_jours: limite_jours ? Number(limite_jours) : null,
      actif: actif !== false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Un type avec ce nom existe déjà." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}

/** PUT — modifier un type de congé */
export async function PUT(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Service role key manquante" }, { status: 500 });

  const { id, nom, couleur, limite_jours, actif } = await req.json();

  if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });
  if (!nom?.trim()) return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });

  const supabase = serviceClient();
  const { error } = await supabase
    .from("types_conge")
    .update({
      nom: nom.trim(),
      couleur: couleur || "#3b82f6",
      limite_jours: limite_jours ? Number(limite_jours) : null,
      actif: actif !== false,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Un type avec ce nom existe déjà." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
