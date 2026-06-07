export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { FormulaireConge } from "@/components/demande/FormulaireConge";

export default async function DemandePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employe } = await supabase
    .from("employes")
    .select("nom, prenom, role")
    .eq("id", user.id)
    .single();

  const nomComplet = employe ? `${employe.prenom} ${employe.nom}` : user.email ?? "Employé";
  const role = (employe?.role ?? "employe") as "employe" | "admin" | "manager";

  return (
    <AppLayout
      titre="Nouvelle demande de congé"
      sousTitre="Remplissez le formulaire ci-dessous pour soumettre votre demande"
      role={role}
      nomUtilisateur={nomComplet}
    >
      <div className="max-w-2xl">
        <FormulaireConge />
      </div>
    </AppLayout>
  );
}
