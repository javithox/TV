import { useEffect, useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ChannelItem from "@/components/ChannelItem";
import { filterChannels, resolveInitialChannel, sourceLabels, type ContentItem, type SourceType } from "@/services/api";
import PlayerSurface from "@/components/PlayerSurface";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import {
  ExternalLink,
  FilePlus2,
  LogIn,
  Play,
  Pause,
  Radio,
  Search,
  ShieldCheck,
  Settings2,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [sourceName, setSourceName] = useState("");
  const [payload, setPayload] = useState("");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const utils = trpc.useUtils();

  const contentQuery = trpc.content.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const preferencesQuery = trpc.content.preferences.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const savePreferencesMutation = trpc.content.savePreferences.useMutation({
    onError: (error) => toast.error(error.message || "No se pudo guardar la preferencia."),
  });
  const addMutation = trpc.content.add.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.itemCount} elemento(s) añadido(s) a tu biblioteca.`);
      setSourceName("");
      setPayload("");
      setShowAddPanel(false);
      await utils.content.list.invalidate();
      await utils.content.sources.invalidate();
    },
    onError: (error) => toast.error(error.message || "No se pudo analizar la fuente."),
  });
  const removeMutation = trpc.content.remove.useMutation({
    onSuccess: async () => {
      toast.success("Fuente eliminada de tu biblioteca.");
      setSelected(null);
      await utils.content.list.invalidate();
      await utils.content.sources.invalidate();
    },
    onError: (error) => toast.error(error.message || "No se pudo eliminar la fuente."),
  });

  const content = (contentQuery.data ?? []) as ContentItem[];
  const player = useHlsPlayer({
    selected,
    preferredQuality: preferencesQuery.data?.preferredQuality || "auto",
    onPreferenceChange: (contentItemId, preferredQuality) => savePreferencesMutation.mutate({ lastContentItemId: contentItemId, preferredQuality }),
  });

  const filtered = useMemo(() => filterChannels(content, query), [content, query]);

  useEffect(() => {
    if (!isAuthenticated || contentQuery.isLoading || preferencesQuery.isLoading) return;
    if (!selected && content.length > 0) {
      setSelected(resolveInitialChannel(content, preferencesQuery.data?.lastContentItemId) || filtered[0] || null);
    }
    if (selected && !content.some((item) => item.id === selected.id)) setSelected(filtered[0] ?? content[0] ?? null);
  }, [content, contentQuery.isLoading, filtered, isAuthenticated, preferencesQuery.data, preferencesQuery.isLoading, selected]);





  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    addMutation.mutate({
      name: sourceName.trim() || (sourceType === "url" ? "URL personal" : "Playlist personal"),
      sourceType,
      payload: payload.trim(),
    });
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sesión cerrada.");
  };

  return (
    <div className="min-h-screen bg-[#05070b] text-slate-100 selection:bg-[#ff2bd6] selection:text-black">
      <nav className="neon-nav sticky top-0 z-40 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-7">
          <a href="#inicio" className="brand-mark flex shrink-0 items-center gap-3" aria-label="NEXUS TV inicio">
            <span className="brand-icon"><Radio size={21} /></span>
            <span><b>NEXUS</b><small>TV // PERSONAL</small></span>
          </a>
          <div className="order-3 flex w-full items-center gap-6 overflow-x-auto pb-1 text-[10px] font-bold tracking-[0.2em] text-slate-400 md:order-none md:w-auto md:overflow-visible md:pb-0 md:text-[11px] md:tracking-[0.24em]">
            <a className="nav-link active" href="#inicio">INICIO</a>
            <a className="nav-link" href="#biblioteca">BÚSQUEDA</a>
            <a className="nav-link" href="#añadir">AÑADIR CONTENIDO</a>
            <a className="nav-link" href="#cuenta">CUENTA</a>
          </div>
          <div id="cuenta" className="flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden text-right sm:block"><strong className="block text-xs text-cyan-300">{user?.name || user?.email || "OPERADOR"}</strong><small className="text-[9px] tracking-[0.2em] text-slate-500">SESIÓN ACTIVA</small></span>
                <button className="icon-button" title="Cerrar sesión" onClick={handleLogout}><UserCircle2 size={20} /></button>
              </>
            ) : (
              <button className="neon-button cyan" onClick={() => startLogin()}><LogIn size={16} /> INICIAR SESIÓN</button>
            )}
          </div>
        </div>
      </nav>

      <main id="inicio" className="mx-auto max-w-[1500px] px-4 pb-14 pt-8 sm:px-7 lg:pt-12">
        <header className="hero-grid mb-10 grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="eyebrow"><span /> SISTEMA DE ENTRETENIMIENTO // ONLINE</p>
            <h1 className="hero-title">TU SEÑAL.<br /><em>TU UNIVERSO.</em></h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">Descubre y reproduce tus propios canales, episodios y señales en un espacio privado diseñado para moverse a tu ritmo.</p>
          </div>
          <div className="hud-card hidden lg:block"><div className="hud-corners" /><p className="text-[10px] tracking-[0.3em] text-slate-500">NEXUS // CORE STATUS</p><strong className="mt-3 block text-2xl tracking-wider text-cyan-300">{isAuthenticated ? "SYNCED" : "GUEST MODE"}</strong><div className="mt-4 flex gap-2"><span className="status-dot" /> <span className="text-[10px] text-slate-400">{content.length} SEÑALES INDEXADAS</span></div></div>
        </header>

        {!isAuthenticated && !authLoading && (
          <section className="login-banner mb-8 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4"><ShieldCheck className="mt-1 text-[#ff2bd6]" size={26} /><div><p className="font-bold tracking-wide text-white">ACTIVA TU BIBLIOTECA PERSONAL</p><p className="mt-1 text-sm text-slate-400">Inicia sesión para guardar fuentes y continuar donde lo dejaste.</p></div></div>
            <button className="neon-button pink" onClick={() => startLogin()}><LogIn size={16} /> ENTRAR / REGISTRARME</button>
          </section>
        )}

        <section className="workspace-grid grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
          <div className="player-shell hud-frame">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="eyebrow small"><span /> NOW PLAYING</p><h2 className="mt-1 truncate text-lg font-bold text-white">{selected?.title || "Selecciona una señal"}</h2></div><span className="live-pill"><i /> LIVE</span></div>
            <PlayerSurface selected={selected} videoRef={player.videoRef} hlsRef={player.hlsRef} status={player.status} error={player.error} qualityOptions={player.qualityOptions} selectedQuality={player.selectedQuality} isPlaying={player.isPlaying} volume={player.volume} isMuted={player.isMuted} currentTime={player.currentTime} duration={player.duration} isFullscreen={player.isFullscreen} onTogglePlayback={player.togglePlayback} onToggleMute={player.toggleMute} onVolumeChange={player.changeVolume} onQualityChange={player.changeQuality} onFullscreen={player.toggleFullscreen} onStatusChange={player.setStatus} onError={player.setError} onTimeChange={player.updateTime} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] tracking-[0.15em] text-slate-500"><span>FORMAT // {selected?.sourceType ? sourceLabels[selected.sourceType] : "WAITING"}</span><span>QUALITY // {player.qualityOptions.length > 1 ? (player.selectedQuality === "auto" ? "AUTO" : player.qualityOptions.find((option) => String(option.index) === player.selectedQuality)?.label || "CUSTOM") : "NATIVE"}</span><span>SECURE PLAYBACK // {isAuthenticated ? "ON" : "OFF"}</span></div>
          </div>

          <aside id="biblioteca" className="library-panel hud-frame flex min-h-[520px] flex-col p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="eyebrow small"><span /> PERSONAL INDEX</p><h2 className="mt-1 text-xl font-bold">Biblioteca</h2></div><span className="count-badge">{filtered.length.toString().padStart(2, "0")}</span></div>
            <label className="search-field mt-5"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, categoría..." aria-label="Buscar en la biblioteca" />{query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X size={15} /></button>}</label>
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">{contentQuery.isLoading && <p className="empty-copy">INDEXANDO SEÑALES...</p>}{contentQuery.error && <p className="library-error">No se pudo cargar tu biblioteca. Vuelve a intentarlo.</p>}{!contentQuery.isLoading && !contentQuery.error && !isAuthenticated && <p className="empty-copy">INICIA SESIÓN PARA VER TU ÍNDICE PERSONAL.</p>}{isAuthenticated && !contentQuery.isLoading && filtered.length === 0 && <p className="empty-copy">NO HAY COINCIDENCIAS. AÑADE UNA FUENTE PARA CREAR TU ÍNDICE.</p>}{filtered.map((item) => <ChannelItem key={item.id} channel={item} selected={selected?.id === item.id} onPress={() => setSelected(item)} />)}</div>
          </aside>
        </section>

        <section id="añadir" className="add-section mt-8 hud-frame p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow"><span /> SOURCE INJECTION</p><h2 className="mt-2 text-2xl font-bold">Añadir contenido</h2><p className="mt-2 max-w-xl text-sm text-slate-400">Analiza una URL compatible o pega el contenido de una playlist. Tus fuentes quedan vinculadas a tu cuenta.</p></div><button className="neon-button pink" onClick={() => setShowAddPanel((value) => !value)}><FilePlus2 size={17} /> {showAddPanel ? "CERRAR PANEL" : "NUEVA FUENTE"}</button></div>
          {showAddPanel && <form onSubmit={handleAdd} className="mt-7 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2"><label className="field-label">NOMBRE DE LA FUENTE<input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Ej. Noticias nocturnas" /></label><label className="field-label">TIPO DE ENTRADA<select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}><option value="url">URL DIRECTA</option><option value="m3u">PLAYLIST M3U</option><option value="m3u8">MANIFEST M3U8</option></select></label><label className="field-label md:col-span-2">{sourceType === "url" ? "URL DE REPRODUCCIÓN" : "CONTENIDO DE LA PLAYLIST"}<textarea required value={payload} onChange={(event) => setPayload(event.target.value)} placeholder={sourceType === "url" ? "https://servidor.example/canal.m3u8" : "#EXTM3U\n#EXTINF:-1 group-title=\"Noticias\",Mi canal\nhttps://..."} rows={sourceType === "url" ? 3 : 8} /></label><div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2"><p className="text-xs text-slate-500"><Upload size={14} className="mr-2 inline text-cyan-300" /> Solo se aceptan URLs http/https y playlists con URLs reproducibles.</p><button disabled={addMutation.isPending || !isAuthenticated} className="neon-button cyan disabled:cursor-not-allowed disabled:opacity-40" type="submit">{addMutation.isPending ? "ANALIZANDO..." : isAuthenticated ? "ANALIZAR Y GUARDAR" : "INICIA SESIÓN PARA GUARDAR"}</button></div></form>}
        </section>

        {isAuthenticated && content.length > 0 && <section className="mt-8 flex items-center justify-between border-t border-white/10 pt-5"><p className="text-xs text-slate-500">Las fuentes se guardan por cuenta y se pueden eliminar desde aquí.</p><button className="danger-link" disabled={!selected || removeMutation.isPending} onClick={() => selected && removeMutation.mutate({ sourceId: selected.sourceId })}><Trash2 size={14} /> Eliminar fuente actual</button></section>}

        <footer className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[10px] tracking-[0.18em] text-slate-600 sm:flex-row"><span>NEXUS TV // PERSONAL MEDIA OS</span><span>BUILD 2026.08 // <a className="text-cyan-400" href="#inicio">VOLVER ARRIBA <ExternalLink size={11} className="inline" /></a></span></footer>
      </main>
    </div>
  );
}
