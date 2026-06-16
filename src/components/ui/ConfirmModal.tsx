"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "success";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              tone === "danger" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 transition hover:text-ink"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-secondary">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={isLoading} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={tone === "danger" ? "btn-danger" : "btn-success"}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
