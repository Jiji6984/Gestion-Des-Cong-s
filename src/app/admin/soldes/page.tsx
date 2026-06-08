export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { GestionSoldes } from "@/components/admin/GestionSoldes";

export default async function AdminSoldesPage() {
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

  if (employe?.role !== "admin") redirect("/dashboard");

  const nomComplet = employe ? `${employe.prenom} ${employe.nom}` : "Admin";

  return (
    <AppLayout
      titre="Soldes de congés"
      sousTitre="Consultez et modifiez les soldes de tous les employés"
      role="admin"
      nomUtilisateur={nomComplet}
    >
      <GestionSoldes />
    </AppLayout>
  );
}
