import { AppLayout } from "@/components/layout/AppLayout";
import { SoldesConge } from "@/components/dashboard/SoldesConge";
import { HistoriqueConges } from "@/components/dashboard/HistoriqueConges";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

export default function DashboardPage() {
  return (
    <AppLayout
      titre="Tableau de bord"
      sousTitre="Bienvenue, consultez vos soldes et l'historique de vos congés"
      role="employe"
      nomUtilisateur="Marie Dupont"
    >
      <div className="space-y-6">
        {/* Bouton nouvelle demande */}
        <div className="flex justify-end">
          <Link href="/demande">
            <Button size="md">
              <CalendarPlus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          </Link>
        </div>

        {/* Soldes */}
        <SoldesConge />

        {/* Historique */}
        <HistoriqueConges />
      </div>
    </AppLayout>
  );
}
