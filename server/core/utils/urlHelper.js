function getFrontendUrl(req = null, overrideUrl = null) {
  // 1. Explicit override passed in
  if (overrideUrl && typeof overrideUrl === 'string' && overrideUrl.startsWith('http')) {
    if (!overrideUrl.includes('onrender.com') || process.env.ALLOW_RENDER_FRONTEND === 'true') {
      return overrideUrl.replace(/\/$/, '');
    }
  }

  // 2. Explicit environment variables
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.startsWith('http')) {
    if (!process.env.CLIENT_URL.includes('onrender.com')) {
      return process.env.CLIENT_URL.replace(/\/$/, '');
    }
  }
  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('http')) {
    return process.env.FRONTEND_URL.replace(/\/$/, '');
  }

  // 3. Request origin / referer header
  if (req) {
    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const parsed = new URL(origin);
        if (!parsed.host.includes('onrender.com')) {
          return `${parsed.protocol}//${parsed.host}`;
        }
      } catch {}
    }
  }

  // 4. Default by environment
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.campxcode.in';
  }
  return 'http://localhost:3000';
}

module.exports = {
  getFrontendUrl
};
