ASAS SERVICEUP LIVE SITE

The ServiceUp-powered site is generated as static production HTML at the
normal root routes. Netlify runs `npm run build` and publishes `dist`.

The former live site is automatically copied to:

  /legacy-reference-2026/

That reference copy is protected with noindex, nofollow, noarchive headers and
robots.txt exclusion.

See SERVICEUP-LIVE-DEPLOYMENT.md for first-deploy verification and instructions
for connecting the ServiceUp API to a Netlify build hook.
