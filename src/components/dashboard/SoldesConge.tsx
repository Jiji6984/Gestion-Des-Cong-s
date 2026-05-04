import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Umbrella, Heart, Clock, MinusCircle } from "lucide-react";

const soldes = [
  {
    type: "Congés annuels",
    pris: 8,
    total: 25,
    restant: 17,
    couleur: "text-blue-600",
    bg: "bg-blue-50",
    icone: Umbrella,
  },
  {
    type: "RTT",
    pris: 2,
    total: 12,
    restant: 10,
    couleur: "text-purple-600",
    bg: "bg-purple-50",
    icone: Clock,
  },
  {
    type: "Congé maladie",
    pris: 1,
    total: 30,
    restant: 29,
    couleur: "text-green-600",
    bg: "bg-green-50",
    icone: Heart,
  },
  {
    type: "Sans solde",
    pris: 0,
    total: null,
    restant: null,
    couleur: "text-gray-500",
    bg: "bg-gray-50",
    icone: MinusCircle,
  },
];

export function SoldesConge() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Mes soldes de congés
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {soldes.map((s) => {
          const Icon = s.icone;
          const pourcentage = s.total ? Math.round((s.pris / s.total) * 100) : 0;

          return (
            <Card key={s.type}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <Icon className={`h-5 w-5 ${s.couleur}`} />
                  </div>
                  {s.restant !== null && (
                    <span className={`text-2xl font-bold ${s.couleur}`}>{s.restant}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{s.type}</p>
                {s.total !== null ? (
                  <>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.pris} pris sur {s.total} jours
                    </p>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.couleur.replace("text-", "bg-")}`}
                        style={{ width: `${pourcentage}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Sur justificatif</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
