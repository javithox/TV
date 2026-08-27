import React, { type RefObject } from "react";
import { Maximize2, Minimize2, Pause, Play, Settings2, Volume2, VolumeX, Zap } from "lucide-react";
import type Hls from "hls.js";
import type { ContentItem } from "@/services/api";

type QualityOption = { index: number; label: string };
type PlayerStatus = "idle" | "loading" | "ready" | "error";

type PlayerSurfaceProps = {
  selected: ContentItem | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  hlsRef: RefObject<Hls | null>;
  status: PlayerStatus;
  error: string;
  qualityOptions: QualityOption[];
  selectedQuality: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onQualityChange: (value: string) => void;
  onFullscreen: () => void;
  onStatusChange: (status: PlayerStatus) => void;
  onError: (message: string) => void;
  onTimeChange: (currentTime: number, duration?: number) => void;
};

export default function PlayerSurface({ selected, videoRef, status, error, qualityOptions, selectedQuality, isPlaying, volume, isMuted, currentTime, duration, isFullscreen, onTogglePlayback, onToggleMute, onVolumeChange, onQualityChange, onFullscreen, onStatusChange, onError, onTimeChange }: PlayerSurfaceProps) {
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "00:00";
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  };

  return <div className="video-stage">{selected ? <div className="relative h-full w-full"><video ref={videoRef} playsInline muted={isMuted} className="h-full w-full object-contain" onLoadStart={() => onStatusChange("loading")} onLoadedMetadata={(event) => onTimeChange(event.currentTarget.currentTime, event.currentTarget.duration)} onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)} onCanPlay={() => onStatusChange("ready")} onWaiting={() => onStatusChange("loading")} onPlaying={() => onStatusChange("ready")} onError={() => { onStatusChange("error"); onError("El navegador no pudo abrir esta señal."); }} />{status === "loading" && <div className="player-overlay"><div className="loader-ring" /><span>SINCRONIZANDO SEÑAL...</span></div>}{status === "error" && <div className="player-overlay error"><Zap size={25} /><span>{error || "Señal no disponible"}</span></div>}<div className="custom-controls"><div className="progress-line"><input aria-label="Progreso del video" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { const next = Number(event.target.value); onTimeChange(next); if (videoRef.current) videoRef.current.currentTime = next; }} /></div><div className="control-row"><button className="control-button" onClick={onTogglePlayback} aria-label={isPlaying ? "Pausar" : "Reproducir"}>{isPlaying ? <Pause size={17} /> : <Play size={17} />}</button><button className="control-button" onClick={onToggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"}>{isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><input className="volume-slider" aria-label="Volumen" type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(event) => onVolumeChange(Number(event.target.value))} /><span className="time-code">{formatTime(currentTime)} / {formatTime(duration)}</span><span className="control-spacer" />{qualityOptions.length > 1 && <label className="quality-select"><Settings2 size={14} /><select aria-label="Calidad de reproducción" value={selectedQuality} onChange={(event) => onQualityChange(event.target.value)}><option value="auto">AUTO</option>{qualityOptions.map((option) => <option key={option.index} value={option.index}>{option.label}</option>)}</select></label>}<button className="control-button" onClick={onFullscreen} aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>{isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button></div></div></div> : <div className="empty-stage"><Zap size={30} /><p>Selecciona una señal de tu biblioteca</p><small>O añade una nueva fuente para comenzar</small></div>}</div>;
}
