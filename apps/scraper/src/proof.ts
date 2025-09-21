export async function saveToWayback(url: string, timeoutMs = 20000): Promise<string|undefined> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`https://web.archive.org/save/${url}`, { 
      method: 'GET', 
      redirect: 'manual', 
      signal: ctrl.signal 
    });
    clearTimeout(t);
    const contentLoc = res.headers.get('content-location');
    const loc = res.headers.get('location');
    
    if (contentLoc && contentLoc.includes('/web/')) {
      return `https://web.archive.org${contentLoc}`;
    }
    if (loc && loc.includes('web.archive.org')) {
      return loc;
    }
  } catch {}
  return undefined;
}

export async function saveToArchiveToday(url: string, timeoutMs = 30000): Promise<string|undefined> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const formData = new URLSearchParams();
    formData.append('url', url);
    
    const res = await fetch('https://archive.ph/submit/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: formData.toString(),
      redirect: 'manual', 
      signal: ctrl.signal
    });
    clearTimeout(t);
    
    const loc = res.headers.get('location');
    if (loc && (loc.includes('archive.') || loc.includes('archive.today'))) {
      return loc;
    }
    
    // Sometimes returns refresh header
    const refresh = res.headers.get('refresh');
    if (refresh && refresh.includes('url=')) {
      const match = refresh.match(/url=(https?:\/\/[^\s]+)/);
      if (match) return match[1];
    }
  } catch {}
  return undefined;
}