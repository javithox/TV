function parseAttributes(attributes = '') {
  const result = {};
  const pattern = /([\w-]+)="([^"]*)"|([\w-]+)=([^\s,]*)/g;
  let match;
  while ((match = pattern.exec(attributes)) !== null) {
    result[match[1] || match[3]] = match[2] ?? match[4] ?? '';
  }
  return result;
}

export function parseM3U(content) {
  if (typeof content !== 'string') return [];

  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const channels = [];
  let pending = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.toUpperCase().startsWith('#EXTINF')) {
      const commaIndex = line.indexOf(',');
      const metadata = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
      const fallbackTitle = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : 'Canal';
      const attributes = parseAttributes(metadata);
      pending = {
        title: attributes['tvg-name'] || fallbackTitle || 'Canal',
        logo: attributes['tvg-logo'] || '',
        group: attributes['group-title'] || 'General',
        attributes,
      };
      continue;
    }

    if (/^https?:\/\//i.test(line)) {
      const base = pending || { title: `Canal ${channels.length + 1}`, logo: '', group: 'General', attributes: {} };
      channels.push({
        id: `${channels.length + 1}-${encodeURIComponent(base.title).slice(0, 48)}`,
        ...base,
        url: line,
      });
      pending = null;
    }
  }

  return channels;
}

export default parseM3U;
