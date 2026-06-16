export type UserRole = "admin" | "manager" | "broker";

export type TerrenoStatus = "pendente" | "disponivel" | "em_negociacao" | "vendido";

// Observação: estas entidades usam `type` (não `interface`) de propósito —
// o supabase-js valida o Database genérico checando se cada Row/Insert/Update
// satisfaz `extends Record<string, unknown>`, e `interface`s (por serem
// "open"/aumentáveis via declaration merging) falham nessa checagem
// estrutural, fazendo toda a tipagem de `.insert()`/`.update()` cair para
// `never`. `type` aliases de objeto funcionam corretamente.
export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
  active: boolean;
  created_at: string;
};

export type TerrenoFoto = {
  id: string;
  terreno_id: string;
  storage_path: string;
  ordem: number;
  created_at: string;
};

export type Terreno = {
  id: string;
  endereco: string;
  bairro: string;
  area_m2: number;
  valor: number;
  status: TerrenoStatus;
  link_maps: string | null;
  observacoes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TerrenoComRelacoes = Terreno & {
  fotos: TerrenoFoto[];
  criado_por?: Pick<Profile, "id" | "full_name"> | null;
  aprovado_por?: Pick<Profile, "id" | "full_name"> | null;
};

export type TerrenoFilters = {
  bairro?: string;
  status?: TerrenoStatus[];
  precoMin?: number;
  precoMax?: number;
  areaMin?: number;
  areaMax?: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      terrenos: {
        Row: Terreno;
        Insert: Partial<Terreno>;
        Update: Partial<Terreno>;
        Relationships: [];
      };
      terreno_fotos: {
        Row: TerrenoFoto;
        Insert: Partial<TerrenoFoto> & { terreno_id: string; storage_path: string };
        Update: Partial<TerrenoFoto>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      terreno_status: TerrenoStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
