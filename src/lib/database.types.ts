export type StatutDemande = "en_attente" | "approuve" | "refuse" | "annule";
export type Role = "employe" | "manager" | "admin";

export interface Database {
  public: {
    Tables: {
      employes: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          email: string;
          role: Role;
          departement: string | null;
          manager_id: string | null;
          cree_le: string;
          mis_a_jour_le: string;
        };
        Insert: Omit<Database["public"]["Tables"]["employes"]["Row"], "cree_le" | "mis_a_jour_le">;
        Update: Partial<Database["public"]["Tables"]["employes"]["Insert"]>;
      };
      types_conge: {
        Row: {
          id: string;
          nom: string;
          couleur: string;
          limite_jours: number | null;
          actif: boolean;
          cree_le: string;
        };
        Insert: Omit<Database["public"]["Tables"]["types_conge"]["Row"], "id" | "cree_le">;
        Update: Partial<Database["public"]["Tables"]["types_conge"]["Insert"]>;
      };
      demandes_conge: {
        Row: {
          id: string;
          employe_id: string;
          type_conge_id: string;
          date_debut: string;
          date_fin: string;
          nb_jours: number;
          statut: StatutDemande;
          motif: string | null;
          commentaire_validateur: string | null;
          token_validation: string | null;
          validateur_id: string | null;
          soumis_le: string;
          traite_le: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["demandes_conge"]["Row"], "id" | "soumis_le" | "token_validation">;
        Update: Partial<Database["public"]["Tables"]["demandes_conge"]["Insert"]>;
      };
      soldes_conge: {
        Row: {
          id: string;
          employe_id: string;
          type_conge_id: string;
          annee: number;
          total: number;
          pris: number;
        };
        Insert: Omit<Database["public"]["Tables"]["soldes_conge"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["soldes_conge"]["Insert"]>;
      };
    };
    Views: {
      vue_soldes_conge: {
        Row: {
          id: string;
          employe_id: string;
          type_conge_id: string;
          annee: number;
          total: number;
          pris: number;
          restant: number;
          type_nom: string;
          type_couleur: string;
          employe_nom: string;
          employe_prenom: string;
        };
      };
    };
  };
}
