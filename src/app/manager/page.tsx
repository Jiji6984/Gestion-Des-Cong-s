export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatistiquesEquipe } from "@/components/manager/StatistiquesEquipe";
import { TableauEquipe } from "@/components/manager/TableauEquipe";
import { AbsencesEquipe } from "@/components/manager/AbsencesEquipe";
import { SoldesEquipe } from "@/components/manager/SoldesEquipe";

export default async function ManagerPage() {
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

  if (employe?.role !== "manager" && employe?.role !== "admin") {
    redirect("/dashboard");
  }

  const nomComplet = employe ? `${employe.prenom} ${employe.nom}` : "Manager";

  return (
    <AppLayout
      titre="Mon équipe"
      sousTitre="Gérez les demandes de congé de votre équipe"
      role="manager"
      nomUtilisateur={nomComplet}
    >
      <div className="space-y-6">
        <StatistiquesEquipe managerId={user.id} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AbsencesEquipe managerId={user.id} />
          <SoldesEquipe managerId={user.id} />
        </div>

        <TableauEquipe managerId={user.id} />
      </div>
    </AppLayout>
  );
}
