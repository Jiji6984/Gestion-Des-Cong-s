import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  titre: string;
  sousTitre?: string;
  role?: "employe" | "manager" | "admin";
  nomUtilisateur?: string;
}

export function AppLayout({ children, titre, sousTitre, role = "employe", nomUtilisateur }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} nomUtilisateur={nomUtilisateur} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header titre={titre} sousTitre={sousTitre} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
