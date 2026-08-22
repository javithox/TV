export const parseM3U = (m3uContent) => {
  if (typeof m3uContent !== 'string') return [];

  const lines = m3uContent.split('\n');
  const playlist = [];
  let currentTitle = '';

  lines.forEach((line) => {
    line = line.trim();
    
    if (line.toUpperCase().startsWith('#EXTINF:')) {
      // Extrae la parte después de la última coma (Nombre del Canal)
      const commaIndex = line.lastIndexOf(',');
      currentTitle = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal sin título';
    } else if (line && !line.startsWith('#')) {
      playlist.push({
        title: currentTitle || 'Canal sin título',
        url: line
      });
      currentTitle = '';
    }
  });

  return playlist;
};