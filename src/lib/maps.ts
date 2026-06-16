/**
 * Converte um link do Google Maps em uma URL embedável via iframe.
 * Links comuns (google.com/maps/..., maps.app.goo.gl/...) bloqueiam o embed
 * por padrão; adicionar/garantir `output=embed` resolve para a maioria dos
 * links copiados a partir de "Compartilhar" no Google Maps no formato longo.
 * Retorna null quando não for possível embutir com segurança.
 */
export function toEmbedMapsUrl(linkMaps: string | null | undefined): string | null {
  if (!linkMaps) return null;

  try {
    const url = new URL(linkMaps);
    const isGoogleMaps = /(^|\.)google\.[a-z.]+$/i.test(url.hostname) && url.pathname.includes("/maps");

    if (!isGoogleMaps) return null;
    if (url.searchParams.get("output") === "embed") return url.toString();

    url.searchParams.set("output", "embed");
    return url.toString();
  } catch {
    return null;
  }
}
