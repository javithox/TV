import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { ContentItem } from "@/services/api";

type QualityOption = { index: number; label: string };
type PlayerStatus = "idle" | "loading" | "ready" | "error";

export function buildPlayerPreference(contentItemId: number, selectedQuality: string) {
  return { lastContentItemId: contentItemId, preferredQuality: selectedQuality || "auto" };
}

type UseHlsPlayerOptions = {
  selected: ContentItem | null;
  preferredQuality: string;
  onPreferenceChange?: (contentItemId: number, quality: string) => void;
};

export function useHlsPlayer({ selected, preferredQuality, onPreferenceChange }: UseHlsPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState("");
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState(preferredQuality || "auto");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => setSelectedQuality(preferredQuality || "auto"), [preferredQuality]);

  useEffect(() => {
    if (selected) {
      const preference = buildPlayerPreference(selected.id, selectedQuality);
      onPreferenceChange?.(preference.lastContentItemId, preference.preferredQuality);
    }
  }, [selected?.id, selectedQuality]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected) return;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setStatus("loading");
    setError("");
    setQualityOptions([]);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    video.pause();
    video.removeAttribute("src");
    video.load();

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selected.playbackUrl;
      void video.play().catch(() => undefined);
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(selected.playbackUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityOptions(hls.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round((level.bitrate || 0) / 1000)} kbps` })));
        const preferred = preferredQuality === "auto" ? -1 : Math.min(Number(preferredQuality), hls.levels.length - 1);
        hls.currentLevel = Number.isFinite(preferred) ? preferred : -1;
        setStatus("ready");
        void video.play().catch(() => undefined);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        setStatus("error");
        setError("No se pudo reproducir este canal. Comprueba la URL y CORS.");
      });
    } else {
      video.src = selected.playbackUrl;
      void video.play().catch(() => undefined);
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [preferredQuality, selected]);

  useEffect(() => {
    const video = videoRef.current;
    const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null };
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement || webkitDocument.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    video?.addEventListener("webkitbeginfullscreen", syncFullscreen);
    video?.addEventListener("webkitendfullscreen", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      video?.removeEventListener("webkitbeginfullscreen", syncFullscreen);
      video?.removeEventListener("webkitendfullscreen", syncFullscreen);
    };
  }, [selected]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
  };
  const changeVolume = (value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    setIsMuted(next === 0);
    if (videoRef.current) { videoRef.current.volume = next; videoRef.current.muted = next === 0; }
  };
  const changeQuality = (value: string) => {
    setSelectedQuality(value);
    if (hlsRef.current) hlsRef.current.currentLevel = value === "auto" ? -1 : Number(value);
    if (selected) {
      const preference = buildPlayerPreference(selected.id, value);
      onPreferenceChange?.(preference.lastContentItemId, preference.preferredQuality);
    }
  };
  const toggleFullscreen = async () => {
    const video = videoRef.current;
    const stage = video?.parentElement;
    if (!video || !stage) return;
    const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
    if (document.fullscreenElement || webkitDocument.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen(); else await webkitDocument.webkitExitFullscreen?.();
      return;
    }
    const fullscreenStage = stage as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    const mobileVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (fullscreenStage.requestFullscreen) await fullscreenStage.requestFullscreen();
    else if (mobileVideo.webkitEnterFullscreen) mobileVideo.webkitEnterFullscreen();
    else await fullscreenStage.webkitRequestFullscreen?.();
  };
  const updateTime = (time: number, nextDuration?: number) => {
    setCurrentTime(time);
    if (nextDuration !== undefined) setDuration(nextDuration);
  };

  return { videoRef, hlsRef, status, error, qualityOptions, selectedQuality, isPlaying, volume, isMuted, currentTime, duration, isFullscreen, togglePlayback, toggleMute, changeVolume, changeQuality, toggleFullscreen, updateTime, setStatus, setError, setIsPlaying };
}
