import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { SoldesConge } from "@/components/dashboard/SoldesConge";
import { HistoriqueConges } from "@/components/dashboard/HistoriqueConges";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

export default async function DashboardPage() {
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

  const nomComplet = employe ? `${employe.prenom} ${employe.nom}` : user.email ?? "Utilisateur";
  const role = (employe?.role ?? "employe") as "employe" | "admin";

  return (
    <AppLayout
      titre="Tableau de bord"
      sousTitre={`Bienvenue, ${nomComplet}`}
      role={role}
      nomUtilisateur={nomComplet}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/demande">
            <Button size="md">
              <CalendarPlus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </Link>
        </div>
        <SoldesConge />
        <HistoriqueConges />
      </div>
    </AppLayout>
  );
}
