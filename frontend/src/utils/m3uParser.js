function getAttributes(line) {
  const attributes = {};
  const pattern = /([\w-]+)="([^"]*)"/g;
  let match;
  while ((match = pattern.exec(line)) !== null) attributes[match[1]] = match[2];
  return attributes;
}

export function parseM3U(content) {
  if (typeof content !== 'string') return [];
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const channels = [];
  let pending = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.toUpperCase().startsWith('#EXTINF')) {
      const comma = line.indexOf(',');
      const attrs = getAttributes(line);
      pending = {
        title: comma >= 0 ? line.slice(comma + 1).trim() : attrs['tvg-name'] || 'Canal',
        logo: attrs['tvg-logo'] || '',
        country: (line.match(/\|\s*([A-Z]{2})\s*$/)?.[1]) || 'OTROS',
      };
    } else if (/^https?:\/\//i.test(line)) {
      const base = pending || { title: `Canal ${channels.length + 1}`, logo: '', country: 'OTROS' };
      channels.push({ id: String(channels.length + 1), ...base, url: line });
      pending = null;
    }
  }
  return channels;
}

export default parseM3U;
