import { Bell } from "lucide-react";

interface HeaderProps {
  titre: string;
  sousTitre?: string;
}

export function Header({ titre, sousTitre }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{titre}</h1>
        {sousTitre && <p className="text-sm text-gray-500 mt-0.5">{sousTitre}</p>}
      </div>
      <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
      </button>
    </header>
  );
}
