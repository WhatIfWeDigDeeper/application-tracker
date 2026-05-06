// CORS preflight regression test
//
// Every stack ships its own CORS middleware so the dev UI on a different
// localhost port can call the API. Without a shared test, accidental removal
// or misconfiguration only surfaces when a developer notices their browser
// failing in the browser console.
//
// Asserts: a preflight (OPTIONS with `Origin` and `Access-Control-Request-Method`)
// returns 2xx and an `Access-Control-Allow-Origin` header that admits the
// configured dev-UI origin — either by echoing it or by allowing all (`*`).
//
// Runs against all stacks when API_URL is unset, or a single stack when API_URL is set.

import { ALL_STACKS, getTargetStacks } from './helpers';

describe.each(getTargetStacks(ALL_STACKS))('CORS preflight ($name)', ({ baseUrl, expectedAllowedOrigin }) => {
  it('responds to OPTIONS preflight with an Access-Control-Allow-Origin header that admits the dev UI', async () => {
    const res = await fetch(`${baseUrl}/applications`, {
      method: 'OPTIONS',
      headers: {
        Origin: expectedAllowedOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const allowOrigin = res.headers.get('access-control-allow-origin');
    expect(allowOrigin).not.toBeNull();
    expect([expectedAllowedOrigin, '*']).toContain(allowOrigin);
  });
});
