"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, GripVertical, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTOS, MAX_PHOTO_SIZE_BYTES } from "@/lib/constants";
import { getTerrenoFotoUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export type PhotoItem =
  | { kind: "existing"; id: string; storagePath: string }
  | { kind: "new"; tempId: string; file: File; previewUrl: string };

interface PhotoUploaderProps {
  items: PhotoItem[];
  onItemsChange: (items: PhotoItem[]) => void;
  disabled?: boolean;
}

export function PhotoUploader({ items, onItemsChange, disabled }: PhotoUploaderProps) {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const remainingSlots = MAX_PHOTOS - items.length;

    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos por terreno.`);
      return;
    }

    const accepted: PhotoItem[] = [];

    for (const file of incoming) {
      if (accepted.length >= remainingSlots) {
        toast.error(`Apenas ${MAX_PHOTOS} fotos são permitidas. Alguns arquivos foram ignorados.`);
        break;
      }
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" não é JPG, PNG ou WEBP.`);
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        toast.error(`"${file.name}" excede 5MB.`);
        continue;
      }
      accepted.push({
        kind: "new",
        tempId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      onItemsChange([...items, ...accepted]);
    }
  }

  function removeAt(index: number) {
    const item = items[index];
    if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
    onItemsChange(items.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  // Reordenação simples por drag-and-drop dos thumbnails.
  function handleThumbDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleThumbDragOver(index: number, e: React.DragEvent) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    dragIndexRef.current = index;
    onItemsChange(next);
  }

  function handleThumbDragEnd() {
    dragIndexRef.current = null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFiles(true);
        }}
        onDragLeave={() => setIsDraggingFiles(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition duration-200",
          isDraggingFiles ? "border-brand bg-brand/5" : "border-gray-200 hover:border-brand/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <UploadCloud className="h-7 w-7 text-brand" />
        <p className="text-sm font-medium text-ink">
          Arraste fotos aqui ou <span className="text-brand">clique para selecionar</span>
        </p>
        <p className="text-xs text-ink-secondary">
          JPG, PNG ou WEBP · máx. 5MB cada · até {MAX_PHOTOS} fotos ({items.length}/{MAX_PHOTOS})
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_PHOTO_TYPES.join(",")}
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item, index) => {
            const src = item.kind === "existing" ? getTerrenoFotoUrl(item.storagePath) : item.previewUrl;
            return (
              <div
                key={item.kind === "existing" ? item.id : item.tempId}
                draggable={!disabled}
                onDragStart={() => handleThumbDragStart(index)}
                onDragOver={(e) => handleThumbDragOver(index, e)}
                onDragEnd={handleThumbDragEnd}
                className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-surface-muted"
              >
                {src ? (
                  <Image src={src} alt={`Foto ${index + 1}`} fill className="object-cover" unoptimized={item.kind === "new"} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageOff className="h-6 w-6 text-gray-300" />
                  </div>
                )}

                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-navy-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Capa
                  </span>
                )}

                {!disabled && (
                  <>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remover foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 flex h-6 w-6 cursor-grab items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
