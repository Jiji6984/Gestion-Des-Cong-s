"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notif {
  id: string;
  message: string;
  date: string;
  type: "approuve" | "refuse" | "en_attente";
}

export function NotifBell() {
  const [ouvert, setOuvert]   = useState(false);
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [role, setRole]       = useState<string>("employe");
  const [titre, setTitre]     = useState("Notifications");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: emp } = await supabase
        .from("employes")
        .select("role")
        .eq("id", user.id)
        .single();

      const r = emp?.role ?? "employe";
      setRole(r);

      if (r === "employe") {
        setTitre("Mes notifications récentes");
        const depuis = new Date();
        depuis.setDate(depuis.getDate() - 30);

        const { data } = await supabase
          .from("demandes_conge")
          .select("id, statut, traite_le, types_conge!type_conge_id(nom)")
          .eq("employe_id", user.id)
          .in("statut", ["approuve", "refuse"])
          .not("traite_le", "is", null)
          .gte("traite_le", depuis.toISOString())
          .order("traite_le", { ascending: false })
          .limit(5);

        setNotifs(
          (data ?? []).map((d: any) => ({
            id: d.id,
            message: `Demande de ${d.types_conge?.nom ?? "congé"} ${d.statut === "approuve" ? "approuvée" : "refusée"}`,
            date: d.traite_le,
            type: d.statut,
          }))
        );
      } else if (r === "manager") {
        setTitre("Demandes en attente — Mon équipe");
        const { data: equipe } = await supabase
          .from("employes")
          .select("id")
          .eq("manager_id", user.id);

        const ids = (equipe ?? []).map((e: any) => e.id);
        if (ids.length > 0) {
          const { data } = await supabase
            .from("demandes_conge")
            .select("id, soumis_le, employes!employe_id(prenom, nom), types_conge!type_conge_id(nom)")
            .in("employe_id", ids)
            .eq("statut", "en_attente")
            .order("soumis_le", { ascending: false })
            .limit(5);

          setNotifs(
            (data ?? []).map((d: any) => ({
              id: d.id,
              message: `${(d.employes as any)?.prenom} ${(d.employes as any)?.nom} — ${(d.types_conge as any)?.nom ?? "congé"}`,
              date: d.soumis_le,
              type: "en_attente",
            }))
          );
        }
      } else {
        // admin
        setTitre("Demandes en attente");
        const { data } = await supabase
          .from("demandes_conge")
          .select("id, soumis_le, employes!employe_id(prenom, nom), types_conge!type_conge_id(nom)")
          .eq("statut", "en_attente")
          .order("soumis_le", { ascending: false })
          .limit(5);

        setNotifs(
          (data ?? []).map((d: any) => ({
            id: d.id,
            message: `${(d.employes as any)?.prenom} ${(d.employes as any)?.nom} — ${(d.types_conge as any)?.nom ?? "congé"}`,
            date: d.soumis_le,
            type: "en_attente",
          }))
        );
      }
    };
    charger();
  }, []);

  // Fermer en cliquant à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = notifs.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOuvert(!ouvert)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{titre}</p>
          </div>

          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Aucune notification pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {n.type === "approuve"   && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {n.type === "refuse"     && <XCircle     className="h-4 w-4 text-red-500"   />}
                      {n.type === "en_attente" && <Clock       className="h-4 w-4 text-yellow-500"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(n.date), "d MMM à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
