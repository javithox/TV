import React, { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PlayerSurface from "./PlayerSurface";
import type { ContentItem } from "@/services/api";

const channel: ContentItem = {
  id: 7,
  sourceId: 2,
  title: "Canal Demo",
  category: "General",
  playbackUrl: "https://example.com/demo.m3u8",
  logoUrl: null,
  sourceName: "Fuente demo",
  sourceType: "m3u8",
};

describe("PlayerSurface", () => {
  it("renders playback, volume, quality and fullscreen controls", () => {
    const html = renderToStaticMarkup(<PlayerSurface
      selected={channel}
      videoRef={createRef<HTMLVideoElement>()}
      hlsRef={createRef<import("hls.js").default>()}
      status="ready"
      error=""
      qualityOptions={[{ index: 0, label: "720p" }, { index: 1, label: "1080p" }]}
      selectedQuality="auto"
      isPlaying
      volume={0.8}
      isMuted={false}
      currentTime={12}
      duration={120}
      isFullscreen={false}
      onTogglePlayback={vi.fn()}
      onToggleMute={vi.fn()}
      onVolumeChange={vi.fn()}
      onQualityChange={vi.fn()}
      onFullscreen={vi.fn()}
      onStatusChange={vi.fn()}
      onError={vi.fn()}
      onTimeChange={vi.fn()}
    />);

    expect(html).toContain('aria-label="Pausar"');
    expect(html).toContain('aria-label="Silenciar"');
    expect(html).toContain('aria-label="Volumen"');
    expect(html).toContain('aria-label="Calidad de reproducción"');
    expect(html).toContain('1080p');
    expect(html).toContain('aria-label="Pantalla completa"');
  });
});
