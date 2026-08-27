// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/services/api";
import { buildPlayerPreference, useHlsPlayer } from "./useHlsPlayer";

const channel = (id: number): ContentItem => ({
  id,
  sourceId: 1,
  title: `Canal ${id}`,
  category: "General",
  playbackUrl: `https://example.com/${id}.m3u8`,
  logoUrl: null,
  sourceName: "Fuente",
  sourceType: "m3u8",
});

describe("useHlsPlayer preferences", () => {
  it("persists the selected channel with its active quality", () => {
    expect(buildPlayerPreference(21, "2")).toEqual({ lastContentItemId: 21, preferredQuality: "2" });
    expect(buildPlayerPreference(21, "")).toEqual({ lastContentItemId: 21, preferredQuality: "auto" });
  });

  it("sends the active quality again when the channel changes", async () => {
    const onPreferenceChange = vi.fn();
    const { result, rerender } = renderHook(({ selected }) => useHlsPlayer({ selected, preferredQuality: "2", onPreferenceChange }), { initialProps: { selected: channel(10) } });

    await waitFor(() => expect(onPreferenceChange).toHaveBeenCalledWith(10, "2"));
    onPreferenceChange.mockClear();
    act(() => result.current.changeQuality("1"));
    await waitFor(() => expect(onPreferenceChange).toHaveBeenCalledWith(10, "1"));
    onPreferenceChange.mockClear();
    rerender({ selected: channel(20) });
    await waitFor(() => expect(onPreferenceChange).toHaveBeenCalledWith(20, "1"));
  });
});
