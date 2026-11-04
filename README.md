# ASAS Website

This build uses the client-supplied written content as the actual site copy.

## Content placement

- `index.html` — exact supplied Home Page header, subhead and mission/vision content
- `about.html` — complete ABOUT ASAS document
- `patterns.html` — Common Tactics Used by Alienators
- `families.html` — How Targeted Siblings Can Respond
- `glossary.html` — ASAS Glossary
- `faq.html` — complete ASAS FAQ
- `resources.html` — Recommended Books, Academic Studies & Articles
- `case-studies.html` — How Good People Get Pulled Into Alienation (case examples)
- `professionals/legal.html` — Guidance for Legal Professionals
- `professionals/hospice.html` — Guidance for Hospice Workers & Medical Professionals
- `justice-for-anna/` — Justice for Anna
- `justice-for-anna/the-haircut.html` — The Haircut
- `articles/` — long-form ASAS educational content and companion material
- `acknowledgments.html` — Acknowledgments
- `share-your-story.html` — Share Your ASAS Experience
- `updates.html` — ASAS Updates & Future Resources
- `disclaimer.html` — complete supplied Disclaimer & Scope of Information

## Editorial note

The source section titled “How to use the photos on the Justice for Anna page complete with Captions, Disclaimers, and Guidelines” reads as implementation/legal-publishing guidance rather than normal public page copy. It is preserved in `EDITORIAL-NOTES-JUSTICE-FOR-ANNA.md` for review and was not added to public navigation.

## ServiceUp

The content-heavy sections remain structured so Articles, FAQs, Glossary entries, Resources, Case Studies and Updates can later be migrated to ServiceUp-managed content types without redesigning the front end.

### Staged ServiceUp front end

- `/serviceup/` is a non-indexed parallel preview powered by the shared ServiceUp API.
- The ServiceUp entry with slug `home` renders at `/serviceup/`; `/serviceup/home/` redirects there.
- All preview navigation remains under `/serviceup/`, while the existing static pages remain live and unchanged.
- `serviceup/index.html` is the shared preview shell and `assets/js/serviceup-renderer.js` renders the imported Panels, collections, rich text, forms and assessments.
- Netlify rewrites `/serviceup/*` to the shared shell. When approved, these renderers can be moved to the normal public routes without another content migration.
- The API base is set near the top of `serviceup/index.html`. If the Render service URL differs, update `window.ASAS_SERVICEUP.apiBase` before deployment.

Before testing on the public domain, register both `asasresearch.org` and `www.asasresearch.org` as active domains for the `asas-research` tenant. This allows the shared API to resolve the correct tenant from the browser origin and permits CORS without exposing a tenant override in public code.


## Assessment forms
- `/assessment.html` contains a Netlify Forms email gate (`asas-assessment-access`).
- Successful submissions redirect to `/assessment-access.html`, which contains the interactive 40-item assessment and fillable PDF download.
- `/ciem-16.html` contains the CIEM-16 follow-on assessment.
