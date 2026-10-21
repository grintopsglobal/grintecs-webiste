// OAuth proxy GitHub untuk Decap CMS di GitHub Pages.
// GET /auth     -> redirect ke halaman izin GitHub
// GET /callback -> tukar `code` menjadi token, kirim ke jendela CMS lewat postMessage

const STATE_COOKIE = 'decap_oauth_state';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') return auth(url, env);
    if (url.pathname === '/callback') return callback(request, url, env);
    return new Response('GRINTEC Decap OAuth proxy', { status: 404 });
  },
};

function auth(url, env) {
  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
  authorize.searchParams.set('scope', url.searchParams.get('scope') || 'repo,user');
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.href,
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function callback(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (request.headers.get('Cookie') || '').match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || state !== cookie) return page(env, 'error', { error: 'invalid_state' });

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) return page(env, 'error', { error: data.error || 'token_exchange_failed' });
  return page(env, 'success', { token: data.access_token, provider: 'github' });
}

// Protokol handshake Decap: popup mengirim "authorizing:github", CMS membalas,
// lalu popup mengirim hasil ke origin CMS. Token hanya dikirim ke origin yang diizinkan.
function page(env, status, payload) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><html><body><p>Menyelesaikan login...</p><script>
(function () {
  var allowed = ${safeJson(allowed)};
  var message = ${safeJson(message)};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', receive, false);
    setTimeout(function () { window.close(); }, 500);
  }
  window.addEventListener('message', receive, false);
  if (window.opener) window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': `${STATE_COOKIE}=; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      'Cache-Control': 'no-store',
    },
  });
}

// JSON aman di dalam <script>: cegah "</script>" menutup tag lebih awal.
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
