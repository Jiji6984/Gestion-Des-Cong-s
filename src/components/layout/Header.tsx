import { NotifBell } from "@/components/layout/NotifBell";

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
      <NotifBell />
    </header>
  );
}
