export type StatutDemande = "en_attente" | "approuve" | "refuse" | "annule";
export type Role = "employe" | "admin" | "manager";

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  departement?: string;
  managerId?: string;
  creeLe: string;
}

export interface TypeConge {
  id: string;
  nom: string;
  couleur: string;
  limite?: number;
}

export interface DemandeConge {
  id: string;
  employeId: string;
  employe?: Employe;
  typeCongeId: string;
  typeConge?: TypeConge;
  dateDebut: string;
  dateFin: string;
  nbJours: number;
  statut: StatutDemande;
  motif?: string;
  commentaireValidateur?: string;
  tokenValidation?: string;
  soumisLe: string;
  traiteLe?: string;
  validateurId?: string;
}

export interface SoldeConge {
  id: string;
  employeId: string;
  typeCongeId: string;
  typeConge?: TypeConge;
  annee: number;
  total: number;
  pris: number;
  restant: number;
}
