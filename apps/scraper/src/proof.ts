export async function saveToWayback(url: string, timeoutMs = 20000, maxRetries = 3): Promise<string|undefined> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    Wayback Machine retry (attempt ${attempt + 1}/${maxRetries})...`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(2000 * Math.pow(2, attempt - 1), 10000)));
      }

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

      // If we get a 429 (rate limit), wait longer before retry
      if (res.status === 429 && attempt < maxRetries - 1) {
        console.log('    Wayback Machine rate limit detected, waiting 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    } catch (err: any) {
      if (attempt === maxRetries - 1) {
        console.log(`    Wayback Machine failed after ${maxRetries} attempts: ${err.message || 'Unknown error'}`);
      }
    }
  }
  return undefined;
}

export async function saveToArchiveToday(url: string, timeoutMs = 30000, maxRetries = 3): Promise<string|undefined> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`    Archive.today retry (attempt ${attempt + 1}/${maxRetries})...`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(3000 * Math.pow(2, attempt - 1), 15000)));
      }

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

      // If we get a 429 (rate limit) or 503 (service unavailable), wait longer before retry
      if ((res.status === 429 || res.status === 503) && attempt < maxRetries - 1) {
        console.log(`    Archive.today ${res.status === 429 ? 'rate limit' : 'service unavailable'} detected, waiting 45 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 45000));
      }
    } catch (err: any) {
      if (attempt === maxRetries - 1) {
        console.log(`    Archive.today failed after ${maxRetries} attempts: ${err.message || 'Unknown error'}`);
      }
    }
  }
  return undefined;
}