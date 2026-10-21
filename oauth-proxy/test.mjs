// Self-check tanpa dependensi: node oauth-proxy/test.mjs
import assert from 'node:assert';
const { default: w } = await import('./src/index.js');
const env = { GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 's', ALLOWED_ORIGINS: 'https://grintopsglobal.github.io, http://localhost:4321' };
const r1 = await w.fetch(new Request('https://x.workers.dev/auth?provider=github&scope=repo'), env);
assert.equal(r1.status, 302);
const loc = new URL(r1.headers.get('Location'));
assert.equal(loc.searchParams.get('client_id'), 'cid');
assert.equal(loc.searchParams.get('redirect_uri'), 'https://x.workers.dev/callback');
const state = loc.searchParams.get('state');
assert.ok(r1.headers.get('Set-Cookie').includes(state));
const r2 = await w.fetch(new Request(`https://x.workers.dev/callback?code=abc&state=wrong`, { headers: { Cookie: `decap_oauth_state=${state}` } }), env);
const html = await r2.text();
assert.ok(html.includes('authorization:github:error:'), 'bad state -> error');
assert.ok(html.includes('"https://grintopsglobal.github.io","http://localhost:4321"'));
// success path with mocked GitHub token endpoint
globalThis.fetch = async () => new Response(JSON.stringify({ access_token: 'tok</script>' }));
const r3 = await w.fetch(new Request(`https://x.workers.dev/callback?code=abc&state=${state}`, { headers: { Cookie: `decap_oauth_state=${state}` } }), env);
const h3 = await r3.text();
assert.ok(h3.includes('authorization:github:success:') && !h3.includes('tok</script>'), 'success + escaped');
console.log('worker ok');
