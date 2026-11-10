# ASAS ServiceUp live publishing

This repository now publishes the ServiceUp-powered site as static HTML at the
normal public routes. The previous hand-authored site is preserved at
`/legacy-reference-2026/` with both a robots exclusion and an `X-Robots-Tag`
header of `noindex, nofollow, noarchive`.

## First deployment

1. Commit and push this website package to the existing ASAS GitHub repository.
2. Netlify reads `netlify.toml`, runs `npm run build`, and publishes `dist`.
3. Confirm the build log says `Generated 52 ServiceUp pages` (the count can grow
   when new content is added).
4. Verify `/`, `/articles/`, an article page, `/contact/`, and
   `/legacy-reference-2026/`.

The build intentionally fails if ServiceUp cannot be reached. Netlify then
keeps the previous successful deployment live rather than publishing partial or
empty pages.

## Automatic rebuild after ServiceUp changes

1. In Netlify, open **Project configuration → Build & deploy → Build hooks**.
2. Create a hook named `ServiceUp publish` for the production branch.
3. In the Render service for the ServiceUp API, add one environment variable:

   - Dedicated API: `NETLIFY_BUILD_HOOK_URL` = the hook URL.
   - Shared multi-tenant API: `SERVICEUP_SITE_BUILD_HOOKS` = JSON mapping the
     ASAS tenant slug to the hook URL, for example
     `{"asas":"https://api.netlify.com/build_hooks/..."}`.

4. Redeploy the ServiceUp API once after adding the variable.

ServiceUp waits 15 seconds after a content save and combines nearby edits into
one build request. Netlify then fetches all published content and atomically
replaces the static cache. The old successful cache remains live if a build
fails.

## Manual cache build

Run `npm run build`. Optional build environment variables:

- `SERVICEUP_API_BASE` (already configured in `netlify.toml`)
- `SITE_URL` (already configured in `netlify.toml`)
- `SERVICEUP_EXPORT_FILE` for offline validation using a tenant export

`dist/serviceup-cache-manifest.json` records the generation time and every
generated route.
