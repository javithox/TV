import { describe, expect, it, vi } from "vitest";
import { parsePlaylist } from "./contentParser";

describe("contentParser", () => {
  it("validates a direct URL", async () => {
    await expect(parsePlaylist("https://cdn.example/live.m3u8", "url")).resolves.toMatchObject([
      { playbackUrl: "https://cdn.example/live.m3u8", category: "URL DIRECTA" },
    ]);
  });

  it("parses M3U metadata and channel URLs", async () => {
    const result = await parsePlaylist(
      '#EXTM3U\n#EXTINF:-1 tvg-logo="https://cdn.example/logo.png" group-title="News",Night News\nhttps://cdn.example/night.m3u8',
      "m3u",
    );
    expect(result).toEqual([
      {
        title: "Night News",
        category: "News",
        logoUrl: "https://cdn.example/logo.png",
        playbackUrl: "https://cdn.example/night.m3u8",
      },
    ]);
  });

  it("downloads a remote M3U8 and resolves relative variants", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\nlow/index.m3u8",
      { status: 200 },
    )));
    await expect(parsePlaylist("https://cdn.example/master/master.m3u8", "m3u8")).resolves.toMatchObject([
      { title: "Variante HLS 1", playbackUrl: "https://cdn.example/master/low/index.m3u8" },
    ]);
    vi.unstubAllGlobals();
  });

  it("rejects invalid content", async () => {
    await expect(parsePlaylist("not-a-url", "url")).rejects.toThrow("http://");
    await expect(parsePlaylist("#EXTM3U\n#EXTINF:-1,Empty", "m3u")).rejects.toThrow("URLs reproducibles");
  });
});
