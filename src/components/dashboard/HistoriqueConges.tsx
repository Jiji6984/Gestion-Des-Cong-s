import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const demandes = [
  {
    id: "1",
    type: "Congés annuels",
    dateDebut: new Date("2025-07-14"),
    dateFin: new Date("2025-07-25"),
    nbJours: 10,
    statut: "approuve" as const,
    commentaire: "",
  },
  {
    id: "2",
    type: "RTT",
    dateDebut: new Date("2025-06-02"),
    dateFin: new Date("2025-06-02"),
    nbJours: 1,
    statut: "approuve" as const,
    commentaire: "",
  },
  {
    id: "3",
    type: "Congés annuels",
    dateDebut: new Date("2025-08-18"),
    dateFin: new Date("2025-08-22"),
    nbJours: 5,
    statut: "en_attente" as const,
    commentaire: "",
  },
  {
    id: "4",
    type: "Congé maladie",
    dateDebut: new Date("2025-03-10"),
    dateFin: new Date("2025-03-10"),
    nbJours: 1,
    statut: "approuve" as const,
    commentaire: "",
  },
  {
    id: "5",
    type: "Congés annuels",
    dateDebut: new Date("2025-04-22"),
    dateFin: new Date("2025-04-24"),
    nbJours: 3,
    statut: "refuse" as const,
    commentaire: "Effectif insuffisant sur la période.",
  },
];

export function HistoriqueConges() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de mes demandes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Commentaire
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {demandes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.type}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(d.dateDebut, "d MMM yyyy", { locale: fr })}
                    {d.dateDebut.toDateString() !== d.dateFin.toDateString() && (
                      <> → {format(d.dateFin, "d MMM yyyy", { locale: fr })}</>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.nbJours} jour{d.nbJours > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4">
                    <Badge statut={d.statut} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                    {d.commentaire || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
