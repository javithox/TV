export type SourceType = "url" | "m3u" | "m3u8";

export type ParsedContentItem = {
  title: string;
  category: string;
  playbackUrl: string;
  logoUrl?: string;
};

export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function readAttribute(line: string, name: string) {
  return line.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1]?.trim() ?? "";
}

function resolveHttpUrl(value: string, baseUrl?: string) {
  try {
    const resolved = baseUrl ? new URL(value, baseUrl) : new URL(value);
    return isHttpUrl(resolved.href) ? resolved.href : null;
  } catch {
    return null;
  }
}

export async function parsePlaylist(input: string, sourceType: SourceType): Promise<ParsedContentItem[]> {
  const trimmedInput = input.trim();
  if (sourceType === "url") {
    const url = resolveHttpUrl(trimmedInput);
    if (!url) throw new Error("La URL debe comenzar con http:// o https://.");
    return [{ title: new URL(url).hostname, category: "URL DIRECTA", playbackUrl: url }];
  }

  let text = trimmedInput.replace(/^\uFEFF/, "");
  let baseUrl: string | undefined;
  if (isHttpUrl(trimmedInput)) {
    baseUrl = trimmedInput;
    const response = await fetch(trimmedInput, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`No se pudo descargar la playlist (HTTP ${response.status}).`);
    text = (await response.text()).replace(/^\uFEFF/, "");
  }

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const items: ParsedContentItem[] = [];
  let pending: Omit<ParsedContentItem, "playbackUrl"> | null = null;
  let variantNumber = 0;

  for (const line of lines) {
    if (line.toUpperCase().startsWith("#EXTINF")) {
      const comma = line.indexOf(",");
      const metadata = comma >= 0 ? line.slice(0, comma) : line;
      const title = comma >= 0 ? line.slice(comma + 1).trim() : "Contenido sin título";
      pending = {
        title: title || "Contenido sin título",
        category: readAttribute(metadata, "group-title") || "GENERAL",
        logoUrl: readAttribute(metadata, "tvg-logo") || undefined,
      };
      continue;
    }

    if (line.toUpperCase().startsWith("#EXT-X-STREAM-INF")) {
      variantNumber += 1;
      pending = { title: `Variante HLS ${variantNumber}`, category: "HLS", logoUrl: undefined };
      continue;
    }
    if (line.startsWith("#")) continue;

    const playbackUrl = resolveHttpUrl(line, baseUrl);
    if (!playbackUrl) continue;
    items.push({
      title: pending?.title || `Contenido ${items.length + 1}`,
      category: pending?.category || "GENERAL",
      logoUrl: pending?.logoUrl,
      playbackUrl,
    });
    pending = null;
  }

  if (items.length === 0) throw new Error("No se encontraron URLs reproducibles en la playlist.");
  return items;
}
