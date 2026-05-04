import { AppLayout } from "@/components/layout/AppLayout";
import { TableauDemandes } from "@/components/admin/TableauDemandes";
import { StatistiquesAdmin } from "@/components/admin/StatistiquesAdmin";

export default function AdminPage() {
  return (
    <AppLayout
      titre="Gestion des demandes"
      sousTitre="Consultez et traitez toutes les demandes de congés"
      role="admin"
      nomUtilisateur="Admin RH"
    >
      <div className="space-y-6">
        <StatistiquesAdmin />
        <TableauDemandes />
      </div>
    </AppLayout>
  );
}
