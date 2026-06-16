import type { TerrenoStatus, UserRole } from "@/lib/types";

export const STATUS_LABELS: Record<TerrenoStatus, string> = {
  pendente: "Pendente",
  disponivel: "Disponível",
  em_negociacao: "Em negociação",
  vendido: "Vendido",
};

export const STATUS_BADGE_CLASSES: Record<TerrenoStatus, string> = {
  disponivel: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20",
  em_negociacao: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  vendido: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20",
  pendente: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
};

export const STATUS_DOT_CLASSES: Record<TerrenoStatus, string> = {
  disponivel: "bg-status-disponivel",
  em_negociacao: "bg-status-negociacao",
  vendido: "bg-status-vendido",
  pendente: "bg-status-pendente",
};

export const STATUS_OPTIONS: { value: TerrenoStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "disponivel", label: "Disponível" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "vendido", label: "Vendido" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gestor comercial",
  broker: "Corretor parceiro",
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: "bg-navy-800 text-white",
  manager: "bg-brand/10 text-brand",
  broker: "bg-amber-100 text-amber-700",
};

export const MAX_PHOTOS = 10;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const TERRENO_FOTOS_BUCKET = "terreno-fotos";
