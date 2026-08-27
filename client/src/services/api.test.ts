import { describe, expect, it } from "vitest";
import { filterChannels, resolveInitialChannel, type ContentItem } from "./api";

const channels: ContentItem[] = [
  { id: 1, sourceId: 1, title: "Canal Noticias", category: "Noticias", playbackUrl: "https://example.com/news.m3u8", logoUrl: null, sourceName: "Principal", sourceType: "m3u" },
  { id: 2, sourceId: 1, title: "Música 24", category: "Música", playbackUrl: "https://example.com/music.m3u8", logoUrl: null, sourceName: "Principal", sourceType: "m3u" },
];

describe("content service", () => {
  it("filters channels by title, category or source metadata", () => {
    expect(filterChannels(channels, "noticias")).toHaveLength(1);
    expect(filterChannels(channels, "música")).toHaveLength(1);
    expect(filterChannels(channels, "principal")).toHaveLength(2);
  });

  it("restores the last channel and falls back to the first one", () => {
    expect(resolveInitialChannel(channels, 2)?.title).toBe("Música 24");
    expect(resolveInitialChannel(channels, 999)?.id).toBe(1);
    expect(resolveInitialChannel([], null)).toBeNull();
  });
});
