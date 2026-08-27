import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const player = readFileSync(new URL("../client/src/components/PlayerSurface.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("responsive player UI contract", () => {
  it("keeps navigation and player controls in the source", () => {
    expect(home).toContain("href=\"#biblioteca\"");
    expect(home).toContain("href=\"#añadir\"");
    expect(home).toContain("toggleFullscreen");
    expect(home).toContain("changeQuality");
    expect(home).toContain("changeVolume");
    expect(player).toContain("aria-label=\"Progreso del video\"");
    expect(player).toContain("onQualityChange");
    expect(player).toContain("onFullscreen");
  });

  it("includes mobile layout rules for the navigation and controls", () => {
    expect(styles).toContain("@media (max-width: 520px)");
    expect(styles).toContain(".custom-controls");
    expect(styles).toContain(".volume-slider");
    expect(styles).toContain(".quality-select");
    expect(styles).toContain("flex-wrap: wrap");
    expect(styles).toContain("min-width: 0");
  });
});
