export function parseM3U(content = '') {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  const channels = [];
  let info = '';

  const attr = (name) => {
    const match = info.match(new RegExp(`${name}="([^"]*)"`, 'i'));
    return match?.[1] ?? '';
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.toUpperCase().startsWith('#EXTINF')) {
      info = line;
      continue;
    }

    if (/^https?:\/\//i.test(line)) {
      const title = info.match(/#EXTINF:[^,]*,(.*)$/i)?.[1]?.trim()
        || `Canal ${channels.length + 1}`;

      channels.push({
        id: `${channels.length}-${line}`,
        title,
        url: line,
        group: attr('group-title') || 'Sin categoría',
        logo: attr('tvg-logo') || '',
        tvgId: attr('tvg-id') || ''
      });

      info = '';
    }
  }

  return channels;
}
