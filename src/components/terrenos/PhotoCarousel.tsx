"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LandPlot } from "lucide-react";
import { getTerrenoFotoUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { TerrenoFoto } from "@/lib/types";

export function PhotoCarousel({ fotos, alt }: { fotos: TerrenoFoto[]; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-surface-muted sm:h-96">
        <LandPlot className="h-14 w-14 text-gray-300" />
      </div>
    );
  }

  function scrollToIndex(index: number) {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const container = containerRef.current;
    if (!container) return;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(index);
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex h-64 w-full snap-x snap-mandatory overflow-x-auto rounded-2xl scroll-smooth sm:h-96"
        style={{ scrollbarWidth: "none" }}
      >
        {fotos.map((foto, index) => (
          <div key={foto.id} className="relative h-full w-full flex-shrink-0 snap-center">
            <Image
              src={getTerrenoFotoUrl(foto.storage_path)}
              alt={`${alt} - foto ${index + 1}`}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {fotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:flex"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(fotos.length - 1, activeIndex + 1))}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white sm:flex"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {fotos.map((foto, index) => (
              <button
                key={foto.id}
                onClick={() => scrollToIndex(index)}
                aria-label={`Ir para foto ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
