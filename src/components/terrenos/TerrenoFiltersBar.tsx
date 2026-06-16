"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { STATUS_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TerrenoStatus } from "@/lib/types";

export function TerrenoFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [bairro, setBairro] = useState(searchParams.get("bairro") ?? "");
  const [precoMin, setPrecoMin] = useState(searchParams.get("precoMin") ?? "");
  const [precoMax, setPrecoMax] = useState(searchParams.get("precoMax") ?? "");
  const [areaMin, setAreaMin] = useState(searchParams.get("areaMin") ?? "");
  const [areaMax, setAreaMax] = useState(searchParams.get("areaMax") ?? "");
  const [statusOpen, setStatusOpen] = useState(false);
  const selectedStatus = (searchParams.get("status")?.split(",").filter(Boolean) ??
    []) as TerrenoStatus[];

  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function debouncedPush(next: Record<string, string | null>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams(next), 400);
  }

  function toggleStatus(status: TerrenoStatus) {
    const next = selectedStatus.includes(status)
      ? selectedStatus.filter((s) => s !== status)
      : [...selectedStatus, status];
    pushParams({ status: next.length > 0 ? next.join(",") : null });
  }

  function clearFilters() {
    setBairro("");
    setPrecoMin("");
    setPrecoMax("");
    setAreaMin("");
    setAreaMax("");
    router.push(pathname);
  }

  const hasActiveFilters =
    bairro || precoMin || precoMax || areaMin || areaMax || selectedStatus.length > 0;

  return (
    <div className="card-base flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <SlidersHorizontal className="h-4 w-4 text-brand" />
        Filtros
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Bairro */}
        <div className="relative lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={bairro}
            onChange={(e) => {
              setBairro(e.target.value);
              debouncedPush({ bairro: e.target.value || null });
            }}
            placeholder="Buscar por bairro"
            className="input-base pl-10"
          />
        </div>

        {/* Preço min/max */}
        <div className="flex items-center gap-2">
          <input
            value={precoMin}
            onChange={(e) => {
              setPrecoMin(e.target.value);
              debouncedPush({ precoMin: e.target.value || null });
            }}
            type="number"
            min={0}
            placeholder="Preço mín."
            className="input-base"
          />
          <span className="text-gray-300">–</span>
          <input
            value={precoMax}
            onChange={(e) => {
              setPrecoMax(e.target.value);
              debouncedPush({ precoMax: e.target.value || null });
            }}
            type="number"
            min={0}
            placeholder="Preço máx."
            className="input-base"
          />
        </div>

        {/* Área min/max */}
        <div className="flex items-center gap-2">
          <input
            value={areaMin}
            onChange={(e) => {
              setAreaMin(e.target.value);
              debouncedPush({ areaMin: e.target.value || null });
            }}
            type="number"
            min={0}
            placeholder="Área mín. (m²)"
            className="input-base"
          />
          <span className="text-gray-300">–</span>
          <input
            value={areaMax}
            onChange={(e) => {
              setAreaMax(e.target.value);
              debouncedPush({ areaMax: e.target.value || null });
            }}
            type="number"
            min={0}
            placeholder="Área máx. (m²)"
            className="input-base"
          />
        </div>

        {/* Status multi-select */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setStatusOpen((v) => !v)}
            className="input-base flex items-center justify-between text-left"
          >
            <span className={cn(selectedStatus.length === 0 && "text-gray-400")}>
              {selectedStatus.length === 0
                ? "Status"
                : `${selectedStatus.length} selecionado${selectedStatus.length > 1 ? "s" : ""}`}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {statusOpen && (
            <div className="absolute z-20 mt-2 w-full min-w-[200px] rounded-xl border border-gray-100 bg-white p-2 shadow-card-hover animate-fade-in">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink transition hover:bg-surface-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatus.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Limpar filtros */}
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="btn-secondary lg:col-span-1"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
