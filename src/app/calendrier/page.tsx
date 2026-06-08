export const dynamic = "force-dynamic";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalendrierAbsences } from "@/components/CalendrierAbsences";

export default async function CalendrierPage() {
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

  const nomComplet = employe ? `${employe.prenom} ${employe.nom}` : "Utilisateur";
  const role = (employe?.role ?? "employe") as "employe" | "manager" | "admin";

  return (
    <AppLayout
      titre="Calendrier des absences"
      sousTitre="Vue mensuelle des congés approuvés"
      role={role}
      nomUtilisateur={nomComplet}
    >
      <CalendrierAbsences />
    </AppLayout>
  );
}
