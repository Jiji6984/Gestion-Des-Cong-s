"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  Users,
  LogOut,
  CalendarCheck,
} from "lucide-react";

const navEmploye = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/demande", label: "Nouvelle demande", icon: CalendarPlus },
];

const navAdmin = [
  { href: "/admin", label: "Toutes les demandes", icon: ClipboardList },
  { href: "/admin/employes", label: "Employés", icon: Users },
];

interface SidebarProps {
  role?: "employe" | "admin";
  nomUtilisateur?: string;
}

export function Sidebar({ role = "employe", nomUtilisateur = "Utilisateur" }: SidebarProps) {
  const pathname = usePathname();

  const nav = role === "admin" ? navAdmin : navEmploye;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <CalendarCheck className="h-6 w-6 text-blue-600" />
        <span className="font-semibold text-gray-900 text-sm leading-tight">
          Gestion des<br />Congés
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {role === "admin" && (
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administration
          </p>
        )}
        {nav.map(({ href, label, icon: Icon }) => (
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
            {label}
          </Link>
        ))}
      </nav>

      {/* Utilisateur + Déconnexion */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
            {nomUtilisateur.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{nomUtilisateur}</p>
            <p className="text-xs text-gray-400">{role === "admin" ? "Administrateur" : "Employé"}</p>
          </div>
        </div>
        <button className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
