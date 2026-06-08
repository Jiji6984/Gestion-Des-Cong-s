"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, CalendarPlus, ClipboardList,
  Users, LogOut, CalendarCheck, UsersRound, UserCircle, Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navEmploye = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/demande",   label: "Nouvelle demande", icon: CalendarPlus },
];

const navManager = [
  { href: "/manager", label: "Demandes de l'équipe", icon: UsersRound },
];

const navAdmin = [
  { href: "/admin",          label: "Toutes les demandes", icon: ClipboardList },
  { href: "/admin/employes", label: "Employés",            icon: Users },
  { href: "/admin/soldes",   label: "Soldes",              icon: Wallet },
];

const roleConfig = {
  employe: { label: "Employé",        nav: navEmploye },
  manager: { label: "Manager",        nav: navManager },
  admin:   { label: "Administrateur", nav: navAdmin },
};

interface SidebarProps {
  role?: "employe" | "manager" | "admin";
  nomUtilisateur?: string;
}

export function Sidebar({ role = "employe", nomUtilisateur = "Utilisateur" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { label, nav } = roleConfig[role];

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <CalendarCheck className="h-6 w-6 text-blue-600" />
        <span className="font-semibold text-gray-900 text-sm leading-tight">
          Gestion des<br />Congés
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label: lbl, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "sidebar-link",
              pathname === href || pathname.startsWith(href + "/")
                ? "sidebar-link-active"
                : "sidebar-link-inactive"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {lbl}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/profil"
          className={clsx(
            "flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors",
            pathname === "/profil"
              ? "bg-blue-50"
              : "hover:bg-gray-50"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
            {nomUtilisateur.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{nomUtilisateur}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
          <UserCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
        </Link>
        <button
          onClick={handleDeconnexion}
          className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
