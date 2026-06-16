"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Ruler, Images, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { FormSection } from "./FormSection";
import { PhotoUploader, type PhotoItem } from "./PhotoUploader";
import { STATUS_OPTIONS } from "@/lib/constants";
import { maskCurrencyInput, maskCurrencyToNumber } from "@/lib/utils";
import { createTerreno, updateTerreno } from "@/actions/terrenos";
import type { Profile, TerrenoComRelacoes, TerrenoStatus } from "@/lib/types";

interface TerrenoFormProps {
  profile: Profile;
  terreno?: TerrenoComRelacoes;
}

interface FieldErrors {
  endereco?: string;
  bairro?: string;
  areaM2?: string;
  valor?: string;
  linkMaps?: string;
}

export function TerrenoForm({ profile, terreno }: TerrenoFormProps) {
  const isEdit = Boolean(terreno);
  const canSetStatus = profile.role === "admin" || profile.role === "manager";
  const router = useRouter();

  const [endereco, setEndereco] = useState(terreno?.endereco ?? "");
  const [bairro, setBairro] = useState(terreno?.bairro ?? "");
  const [linkMaps, setLinkMaps] = useState(terreno?.link_maps ?? "");
  const [areaM2, setAreaM2] = useState(terreno ? String(terreno.area_m2) : "");
  const [valorMasked, setValorMasked] = useState(
    terreno ? maskCurrencyInput(String(Math.round(terreno.valor * 100))) : ""
  );
  const [status, setStatus] = useState<TerrenoStatus>(terreno?.status ?? "pendente");
  const [observacoes, setObservacoes] = useState(terreno?.observacoes ?? "");

  const [items, setItems] = useState<PhotoItem[]>(
    terreno?.fotos.map((f) => ({ kind: "existing" as const, id: f.id, storagePath: f.storage_path })) ?? []
  );

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!endereco.trim()) errors.endereco = "Informe o endereço completo.";
    if (!bairro.trim()) errors.bairro = "Informe o bairro.";
    const area = Number(areaM2);
    if (!areaM2 || !Number.isFinite(area) || area <= 0) errors.areaM2 = "Informe uma área válida.";
    const valor = maskCurrencyToNumber(valorMasked);
    if (!valorMasked || valor < 0) errors.valor = "Informe um valor válido.";
    if (linkMaps && !/^https?:\/\//i.test(linkMaps)) {
      errors.linkMaps = "O link deve começar com http:// ou https://.";
    }
    return errors;
  }

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("endereco", endereco.trim());
    formData.set("bairro", bairro.trim());
    formData.set("linkMaps", linkMaps.trim());
    formData.set("areaM2", areaM2);
    formData.set("valor", String(maskCurrencyToNumber(valorMasked)));
    formData.set("observacoes", observacoes.trim());
    if (canSetStatus) formData.set("status", status);

    if (isEdit) {
      const originalIds = new Set((terreno?.fotos ?? []).map((f) => f.id));
      const remainingIds = new Set(
        items.filter((i): i is PhotoItem & { kind: "existing" } => i.kind === "existing").map((i) => i.id)
      );
      const deletedPaths = (terreno?.fotos ?? [])
        .filter((f) => originalIds.has(f.id) && !remainingIds.has(f.id))
        .map((f) => f.storage_path);

      const photoOrder = items.map((item) =>
        item.kind === "existing" ? { type: "existing", id: item.id } : { type: "new" }
      );

      formData.set("photoOrder", JSON.stringify(photoOrder));
      formData.set("deletedPhotoPaths", JSON.stringify(deletedPaths));

      items
        .filter((i): i is PhotoItem & { kind: "new" } => i.kind === "new")
        .forEach((i) => formData.append("newPhotos", i.file));
    } else {
      items
        .filter((i): i is PhotoItem & { kind: "new" } => i.kind === "new")
        .forEach((i) => formData.append("newPhotos", i.file));
    }

    return formData;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ endereco: true, bairro: true, areaM2: true, valor: true, linkMaps: true });
    setSubmitError(null);

    if (hasErrors) {
      toast.error("Verifique os campos destacados.");
      return;
    }

    startTransition(async () => {
      const formData = buildFormData();
      const result = isEdit ? await updateTerreno(terreno!.id, formData) : await createTerreno(formData);

      if (result?.error) {
        setSubmitError(result.error);
        toast.error(result.error);
        if (result.id) router.push(`/terrenos/${result.id}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormSection title="Localização" icon={MapPin}>
        <div>
          <label className="label-base" htmlFor="endereco">
            Endereço completo
          </label>
          <input
            id="endereco"
            className="input-base"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            onBlur={() => markTouched("endereco")}
            placeholder="Rua, número, complemento"
          />
          {touched.endereco && errors.endereco && (
            <p className="mt-1 text-xs text-red-600">{errors.endereco}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base" htmlFor="bairro">
              Bairro
            </label>
            <input
              id="bairro"
              className="input-base"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              onBlur={() => markTouched("bairro")}
              placeholder="Ex.: Santa Mônica"
            />
            {touched.bairro && errors.bairro && (
              <p className="mt-1 text-xs text-red-600">{errors.bairro}</p>
            )}
          </div>

          <div>
            <label className="label-base" htmlFor="linkMaps">
              Link Google Maps
            </label>
            <input
              id="linkMaps"
              className="input-base"
              value={linkMaps}
              onChange={(e) => setLinkMaps(e.target.value)}
              onBlur={() => markTouched("linkMaps")}
              placeholder="https://maps.google.com/..."
            />
            {touched.linkMaps && errors.linkMaps && (
              <p className="mt-1 text-xs text-red-600">{errors.linkMaps}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Dimensões e Valor" icon={Ruler}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-base" htmlFor="areaM2">
              Área (m²)
            </label>
            <input
              id="areaM2"
              type="number"
              min={0}
              step="0.01"
              className="input-base"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
              onBlur={() => markTouched("areaM2")}
              placeholder="Ex.: 450"
            />
            {touched.areaM2 && errors.areaM2 && (
              <p className="mt-1 text-xs text-red-600">{errors.areaM2}</p>
            )}
          </div>

          <div>
            <label className="label-base" htmlFor="valor">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                R$
              </span>
              <input
                id="valor"
                inputMode="numeric"
                className="input-base pl-9"
                value={valorMasked}
                onChange={(e) => setValorMasked(maskCurrencyInput(e.target.value))}
                onBlur={() => markTouched("valor")}
                placeholder="0,00"
              />
            </div>
            {touched.valor && errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor}</p>}
          </div>
        </div>
      </FormSection>

      <FormSection title="Fotos" icon={Images}>
        <PhotoUploader items={items} onItemsChange={setItems} disabled={isPending} />
      </FormSection>

      <FormSection title="Informações adicionais" icon={FileText}>
        {canSetStatus && (
          <div>
            <label className="label-base" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className="input-base"
              value={status}
              onChange={(e) => setStatus(e.target.value as TerrenoStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {!canSetStatus && !isEdit && (
          <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-secondary">
            Este terreno entrará como <strong>Pendente</strong> e ficará disponível após aprovação
            de um gestor ou administrador.
          </p>
        )}

        <div>
          <label className="label-base" htmlFor="observacoes">
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={4}
            className="input-base resize-none"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações relevantes sobre o terreno, condições de pagamento, contato do proprietário, etc."
          />
        </div>
      </FormSection>

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : isEdit ? (
            "Salvar alterações"
          ) : (
            "Cadastrar Terreno"
          )}
        </button>
      </div>
    </form>
  );
}
