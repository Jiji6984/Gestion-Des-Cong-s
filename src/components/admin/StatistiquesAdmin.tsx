import { Card, CardContent } from "@/components/ui/Card";
import { Clock, CheckCircle, XCircle, Users } from "lucide-react";

const stats = [
  { label: "En attente", valeur: 4, icone: Clock, couleur: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "Approuvées ce mois", valeur: 12, icone: CheckCircle, couleur: "text-green-600", bg: "bg-green-50" },
  { label: "Refusées ce mois", valeur: 2, icone: XCircle, couleur: "text-red-600", bg: "bg-red-50" },
  { label: "Employés actifs", valeur: 28, icone: Users, couleur: "text-blue-600", bg: "bg-blue-50" },
];

export function StatistiquesAdmin() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icone;
        return (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.couleur}`}>{s.valeur}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <Icon className={`h-6 w-6 ${s.couleur}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
