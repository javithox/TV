export const sourceLabels = {
  url: "URL DIRECTA",
  m3u: "PLAYLIST M3U",
  m3u8: "MANIFEST M3U8",
} as const;

export type SourceType = keyof typeof sourceLabels;

export type ContentItem = {
  id: number;
  sourceId: number;
  title: string;
  category: string;
  playbackUrl: string;
  logoUrl: string | null;
  sourceName: string;
  sourceType: SourceType;
};

export function filterChannels(channels: ContentItem[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return channels;
  return channels.filter((channel) =>
    [channel.title, channel.category, channel.sourceName, channel.sourceType]
      .some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function resolveInitialChannel(channels: ContentItem[], lastUsedId: number | null | undefined) {
  return channels.find((channel) => channel.id === lastUsedId) || channels[0] || null;
}
