import { AppLayout } from "@/components/layout/AppLayout";
import { FormulaireConge } from "@/components/demande/FormulaireConge";

export default function DemandePage() {
  return (
    <AppLayout
      titre="Nouvelle demande de congé"
      sousTitre="Remplissez le formulaire ci-dessous pour soumettre votre demande"
      role="employe"
      nomUtilisateur="Marie Dupont"
    >
      <div className="max-w-2xl">
        <FormulaireConge />
      </div>
    </AppLayout>
  );
}
