import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'dist');
const api = String(process.env.SERVICEUP_API_BASE || 'https://serviceup-shared-api.onrender.com').replace(/\/$/, '');
const exportFile = process.env.SERVICEUP_EXPORT_FILE;
const siteUrl = String(process.env.SITE_URL || 'https://asasresearch.org').replace(/\/$/, '');
const legacyBase = '/legacy-reference-2026';
const types = ['page','article','story','assessment','case-study','resource','update','faq-item','glossary-term'];
let assetVersion = 'serviceup-live';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr = esc;
const cleanPath = value => {
  let raw = typeof value === 'object' && value ? (value.url || value.href || value.path || '') : value;
  if (!raw) return '';
  if (/^https?:/.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.origin !== siteUrl) return raw;
      raw = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch { return raw; }
  }
  if (/^(mailto:|tel:|#)/.test(raw)) return raw;
  const cleaned = String(raw).replace(/^\/+/, '').replace(/^serviceup\/?/, '').replace(/\.html(?=($|[?#]))/, '').replace(/\/index(?=($|[?#]))/, '/').replace(/\/+$/, '');
  return cleaned ? `/${cleaned}/` : '/';
};
const linkAttrs = value => {
  const href = cleanPath(value);
  const target = typeof value === 'object' && value?.target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `href="${attr(href)}"${target}`;
};
function rich(node) {
  if (!node) return '';
  if (typeof node === 'string') return esc(node);
  if (Array.isArray(node)) return node.map(rich).join('');
  const body = rich(node.content || []), a = node.attrs || {};
  switch (node.type) {
    case 'doc': return body;
    case 'text': {
      let text = esc(node.text || '');
      for (const mark of node.marks || []) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`;
        if (mark.type === 'italic') text = `<em>${text}</em>`;
        if (mark.type === 'underline') text = `<u>${text}</u>`;
        if (mark.type === 'link') text = `<a ${linkAttrs(mark.attrs?.href || '')}>${text}</a>`;
      }
      return text;
    }
    case 'paragraph': return `<p>${body}</p>`;
    case 'heading': return `<h${a.level || 2}>${body}</h${a.level || 2}>`;
    case 'bulletList': return `<ul>${body}</ul>`;
    case 'orderedList': return `<ol>${body}</ol>`;
    case 'listItem': return `<li>${body}</li>`;
    case 'blockquote': return `<blockquote>${body}</blockquote>`;
    case 'hardBreak': return '<br>';
    case 'horizontalRule': return '<hr>';
    case 'codeBlock': return `<pre><code>${body}</code></pre>`;
    default: return body;
  }
}
const divider = theme => `<div aria-hidden="true" class="section-divider ${theme === 'dark' ? 'dark' : theme === 'yellow' ? 'yellow' : 'light'}"></div>`;
const themeClass = theme => theme === 'dark' ? 'dark-section' : theme === 'yellow' ? 'yellow-section' : 'light-section';
const buttons = d => {
  const output = [];
  if (d.primary_label) output.push(`<a class="btn yellow" ${linkAttrs(d.primary_url)}>${esc(d.primary_label)}</a>`);
  if (d.secondary_label) output.push(`<a class="btn ghost" ${linkAttrs(d.secondary_url)}>${esc(d.secondary_label)}</a>`);
  return output.length ? `<div class="hero-actions">${output.join('')}</div>` : '';
};
function renderHero(d = {}) {
  const background = d.background_image ? ` style="--hero-image:url('${attr(d.background_image)}')"` : '';
  const accent = String(d.heading_accent || '').trim();
  let heading = esc(d.heading || '');
  if (accent && d.accent_position !== 'hidden') heading = d.accent_position === 'before' ? `<span class="accent">${esc(accent)}</span> ${heading}` : `${heading} <span class="accent">${esc(accent)}</span>`;
  return `<section class="hero ${d.variant === 'homepage' ? 'hero-home' : ''} ${d.variant === 'yellow' ? 'hero-yellow' : ''}"${background}><div class="hero-shade"></div><div class="container hero-content reveal in-view">${d.eyebrow ? `<p class="eyebrow">${esc(d.eyebrow)}</p>` : ''}<h1>${heading}</h1>${d.summary ? `<p class="hero-copy">${esc(d.summary)}</p>` : ''}${buttons(d)}</div></section>`;
}
const card = item => `<a class="info-card reveal in-view" ${linkAttrs(item.url)}>${item.number ? `<span class="card-icon">${esc(item.number)}</span>` : ''}${item.eyebrow ? `<span class="tag">${esc(item.eyebrow)}</span>` : ''}<h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>${item.label ? `<span class="text-link">${esc(item.label)}</span>` : ''}</a>`;
const dateValue = value => {
  const raw = value && typeof value === 'object' ? (value.utc || value.iso || value.value || value.date) : value;
  const time = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(time) ? time : 0;
};
const newestFirst = (a, b) => dateValue(b.published_at || b.data?.published_at || b.data?.publish_date) - dateValue(a.published_at || a.data?.published_at || a.data?.publish_date) || dateValue(b.created_at || b.data?.created_at) - dateValue(a.created_at || a.data?.created_at) || String(a.title || '').localeCompare(String(b.title || ''), undefined, {numeric:true,sensitivity:'base'});
const articleImages = {
  'articles-what-to-do-when-alienating-sibling-attacks':'pexels-nabilnaidu-37949614.jpg',
  'articles-common-mistakes-targeted-siblings-make':'pexels-traphitho-11179951.jpeg',
  'articles-17-things-alienator-hopes-you-never-figure-out':'pexels-anna-romanova-1406375-13749427.jpeg',
  'articles-coalition-around-alienator':'pexels-ozuks-19797160.jpg',
  'articles-community-around-alienated':'pexels-zero-21050936.jpeg',
  'articles-how-alienation-happens':'pexels-deklansor-67-105200005-9587176.jpeg',
  'articles-alienation-unmasked':'pexels-anna-romanova-1406375-13749427.jpeg',
  'articles-church-culture-narrative-vulnerability':'pexels-ozuks-19797160.jpg',
  'articles-personality-trait-cluster':'pexels-zero-21050936.jpeg',
  'articles-primary-drivers-of-alienation':'pexels-deklansor-67-105200005-9587176.jpeg',
  'articles-companion-pages':'pexels-anna-romanova-1406375-13749427.jpeg',
  'articles-psychological-factors':'pexels-ozuks-19797160.jpg',
  'articles-worst-case-asas-profile':'pexels-zero-21050936.jpeg',
  'articles-favorite-to-only-child-fantasies':'pexels-deklansor-67-105200005-9587176.jpeg'
};

let collections = new Map();
const entries = type => collections.get(type) || [];
const entryPath = (entry, type) => {
  const slug = entry.slug.replace(/^articles-/, '');
  if (type === 'page' && entry.slug === 'home') return '/';
  if (type === 'article') return `/articles/${slug}/`;
  if (type === 'story') return entry.slug === 'justice-for-anna' ? '/justice-for-anna/' : `/justice-for-anna/${entry.slug.replace(/^justice-for-anna-/, '')}/`;
  if (type === 'case-study') return `/case-studies/${entry.slug}/`;
  if (type === 'update') return `/updates/${entry.slug}/`;
  if (type === 'resource' && entry.data?.url) return cleanPath(entry.data.url);
  if (type === 'assessment' && entry.slug === 'assessment') return '/assessment/';
  return `/${entry.slug.replace(/^professionals-/, 'professionals/')}/`;
};
const summary = entry => entry.data?.summary || entry.data?.description || entry.data?.definition || entry.data?.answer || '';
function collectionMarkup(type, layout, label = '') {
  let list = [...entries(type)];
  if (type === 'article' || type === 'update') list.sort(newestFirst);
  if (layout === 'accordion') return list.map(entry => `<details class="faq"><summary>${esc(entry.title)}<span>+</span></summary><div>${rich(entry.data?.answer || entry.data?.body || entry.data?.description)}</div></details>`).join('');
  if (layout === 'glossary') return `<div class="glossary-list">${list.map(entry => `<article class="glossary-item"><h2>${esc(entry.title)}</h2>${rich(entry.data?.definition || entry.data?.description)}</article>`).join('')}</div>`;
  return `<div class="article-grid">${list.map(entry => {
    const d = entry.data || {};
    const image = d.featured_image || d.featured_image_url || d.image || d.hero_image || (articleImages[entry.slug] ? `/assets/img/${articleImages[entry.slug]}` : '');
    return `<article class="article-card reveal in-view">${image ? `<img loading="lazy" src="${attr(image)}" alt="${attr(d.featured_image_alt || entry.title)}">` : ''}<div>${type === 'article' ? `<p class="eyebrow">${esc(d.eyebrow || 'Insight')}</p>` : ''}<h2>${esc(entry.title)}</h2>${typeof summary(entry) === 'object' ? rich(summary(entry)) : `<p>${esc(summary(entry))}</p>`}<a class="text-link" href="${attr(entryPath(entry, type))}">${esc(label || (type === 'article' ? 'Read article →' : 'Read more →'))}</a></div></article>`;
  }).join('')}</div>`;
}
function panel(item) {
  const d = item.data || {}, theme = themeClass(d.theme), head = `${d.eyebrow ? `<p class="eyebrow">${esc(d.eyebrow)}</p>` : ''}${d.heading ? `<h2>${esc(d.heading)}</h2>` : ''}`;
  if (item.type === 'hero') return renderHero(d);
  if (item.type === 'editorial_section') return `<section class="section ${theme}"><div class="container ${d.side_heading ? 'prose-grid' : ''}"><article class="prose reveal in-view">${head}${rich(d.body)}</article>${d.side_heading ? `<aside class="side-card reveal in-view"><p class="eyebrow">${esc(d.side_eyebrow)}</p><h2>${esc(d.side_heading)}</h2>${rich(d.side_body)}${d.side_link_label ? `<a class="text-link" ${linkAttrs(d.side_link_url)}>${esc(d.side_link_label)}</a>` : ''}</aside>` : ''}</div></section>`;
  if (item.type === 'image_text') return `<section class="section ${theme}"><div class="container split ${d.image_side === 'left' ? 'reverse' : ''}"><div class="reveal in-view">${head}${rich(d.body)}${d.button_label ? `<a class="text-link" ${linkAttrs(d.button_url)}>${esc(d.button_label)}</a>` : ''}</div>${d.image ? `<figure class="media-frame"><img loading="lazy" src="${attr(d.image)}" alt="${attr(d.image_alt)}"></figure>` : ''}</div></section>`;
  if (item.type === 'card_grid') return `<section class="section ${theme}"><div class="container"><div class="section-head reveal in-view">${head}${rich(d.intro)}</div><div class="card-grid three">${(d.cards || []).map(card).join('')}</div></div></section>`;
  if (item.type === 'feature_grid') return `<section class="section ${theme}"><div class="container"><div class="section-head reveal in-view">${head}${rich(d.intro)}</div><div class="story-grid">${(d.items || []).map((x, i) => `<article class="story-card ${i === 0 ? 'large ' : ''}reveal in-view">${x.image ? `<img loading="lazy" src="${attr(x.image)}" alt="${attr(x.image_alt)}">` : ''}<div>${x.eyebrow ? `<span class="tag">${esc(x.eyebrow)}</span>` : ''}<h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><a ${linkAttrs(x.url)}>${esc(x.label || 'Read more →')}</a></div></article>`).join('')}</div></div></section>`;
  if (item.type === 'quote_cta') return `<section class="section ${theme} quote-section"><div class="container narrow reveal in-view">${head}<blockquote>${esc(d.quote)}</blockquote>${rich(d.body)}${d.button_label ? `<a class="btn yellow" ${linkAttrs(d.button_url)}>${esc(d.button_label)}</a>` : ''}</div></section>`;
  if (item.type === 'collection_grid') return `<section class="section ${theme}"><div class="container"><div class="section-head reveal in-view">${head}${rich(d.intro)}</div>${collectionMarkup(d.content_type, d.layout, d.link_label)}</div></section>`;
  if (item.type === 'contact_form') return `<section class="section ${theme}"><div class="container contact-grid"><div class="reveal in-view">${head}${rich(d.intro)}${rich(d.notice)}</div><form class="contact-form" name="${attr(d.form_name || 'contact')}" method="POST" data-netlify="true" action="${attr(cleanPath(d.success_url || '/thank-you-contact/'))}"><input type="hidden" name="form-name" value="${attr(d.form_name || 'contact')}">${(d.fields || []).map(field => `<label>${esc(field.label)}${field.type === 'textarea' ? `<textarea name="${attr(field.name)}" ${field.required ? 'required' : ''}></textarea>` : `<input type="${attr(field.type || 'text')}" name="${attr(field.name)}" ${field.required ? 'required' : ''}>`}</label>`).join('')}<button class="btn yellow" type="submit">${esc(d.button_label || 'Submit')}</button></form></div></section>`;
  if (item.type === 'assessment_tool') return `<section class="section ${theme}"><div class="container"><div class="section-head reveal in-view">${head}${rich(d.intro)}</div><div class="callout"><p>This interactive assessment is available online.</p><a class="btn yellow" href="/assessment-access/">${esc(d.access_button_label || 'Open assessment')}</a>${d.download_url ? ` <a class="button secondary" href="${attr(d.download_url)}">${esc(d.download_label || 'Download PDF')}</a>` : ''}</div></div></section>`;
  if (item.type === 'download') return `<section class="section ${theme}"><div class="container narrow reveal in-view">${head}${rich(d.body)}<a class="btn yellow" href="${attr(d.file || d.url)}">${esc(d.button_label || 'Download')}</a></div></section>`;
  return '';
}
function articleBody(d) {
  const body = d.body;
  const hasBody = body?.type === 'doc' && Array.isArray(body.content) && body.content.some(node => node.type !== 'paragraph' || (node.content?.length || 0) > 0);
  return hasBody ? body : (d.panels?.panels || []).find(item => item.type === 'editorial_section')?.data?.body;
}
function renderArticle(entry) {
  const d = entry.data || {};
  const hero = renderHero({eyebrow:d.eyebrow || 'Insight',heading:entry.title,summary:d.summary || '',background_image:d.hero_image || '',variant:'standard'});
  const callout = d.callout_heading ? `<aside class="side-card reveal in-view">${d.callout_eyebrow ? `<p class="eyebrow">${esc(d.callout_eyebrow)}</p>` : ''}<h2>${esc(d.callout_heading)}</h2>${rich(d.callout_body)}${d.callout_link_label ? `<a class="text-link" ${linkAttrs(d.callout_link_url)}>${esc(d.callout_link_label)}</a>` : ''}</aside>` : '';
  return `${hero}${divider('light')}<section class="section light-section"><div class="container ${callout ? 'prose-grid' : ''}"><article class="prose reveal in-view">${rich(articleBody(d))}</article>${callout}</div></section>`;
}
function renderAssessment(entry) {
  const d = entry.data || {}, questions = d.questions || [], four = entry.slug === 'ciem-16';
  return `${renderHero({eyebrow:d.eyebrow || 'Educational assessment',heading:entry.title,summary:d.summary || d.intro || '',background_image:d.hero_image || ''})}${divider('light')}<section class="section light-section"><div class="container"><form class="assessment-form" data-serviceup-assessment>${questions.map((q, index) => `<fieldset class="assessment-section"><legend>${esc(q.category || `Question ${index + 1}`)}</legend><div class="assessment-question"><p><strong>${esc(q.prompt)}</strong></p><div class="rating-options ${four ? 'four' : ''}">${Array.from({length:four ? 4 : 5}, (_, value) => `<label><input required type="radio" name="q${index}" value="${value}"><span>${value}</span><small>${four ? ['Not present','Mild','Moderate','Severe'][value] : ['Never','Rarely','Sometimes','Often','Very Often'][value]}</small></label>`).join('')}</div></div></fieldset>`).join('')}<div class="assessment-actions"><button class="button primary" type="submit">Calculate score</button><button class="button secondary" type="reset">Reset</button></div><div class="assessment-results" hidden><p class="eyebrow">Educational score</p><div class="overall-score"><strong>Total</strong><span data-total>0</span><small>/ ${questions.length * (four ? 3 : 4)}</small></div><p>This score is educational and is not a clinical or legal diagnosis.</p></div></form></div></section>`;
}
const nav = `<header class="site-header" data-header><div class="nav-shell"><a aria-label="ASAS home" class="brand" href="/"><span aria-hidden="true" class="brand-mark">A</span><span><strong>ASAS</strong><small>Adult Sibling Alienation Syndrome</small></span></a><nav aria-label="Primary navigation" class="desktop-nav"><a href="/start-here/">Start Here</a><div class="nav-drop"><button aria-expanded="false">Understand <span aria-hidden="true" class="nav-chevron"></span></button><div class="drop-menu"><a href="/about/">About ASAS</a><a href="/patterns/">Patterns &amp; Tactics</a><a href="/case-studies/">Case Studies</a><a href="/glossary/">Glossary</a><a href="/faq/">FAQ</a><a href="/acknowledgments/">Acknowledgments</a></div></div><div class="nav-drop"><button aria-expanded="false">Resources <span aria-hidden="true" class="nav-chevron"></span></button><div class="drop-menu"><a href="/resources/">Resources &amp; Tools</a><a href="/assessment/">ASAS Assessment</a><a href="/ciem-16/">CIEM-16</a><a href="/families/">For Families</a><a href="/professionals/legal/">For Legal Professionals</a><a href="/professionals/hospice/">For Hospice &amp; Medical</a><a href="/updates/">Updates</a></div></div><a href="/articles/">Insights</a><a href="/justice-for-anna/">Justice for Anna</a><a class="nav-cta" href="/contact/">Contact</a></nav><button aria-controls="mobile-menu" aria-expanded="false" aria-label="Open menu" class="menu-toggle" data-menu-toggle><span></span><span></span><span></span></button></div></header><div aria-hidden="true" class="mobile-menu" data-mobile-menu id="mobile-menu"><div class="mobile-menu-inner"><a class="mobile-menu-link" href="/">Home</a><a class="mobile-menu-link" href="/start-here/">Start Here</a><a class="mobile-menu-link" href="/about/">About ASAS</a><a class="mobile-menu-link" href="/patterns/">Patterns &amp; Tactics</a><a class="mobile-menu-link" href="/resources/">Resources</a><a class="mobile-menu-link" href="/articles/">Insights</a><a class="mobile-menu-link" href="/justice-for-anna/">Justice for Anna</a><a class="mobile-menu-link" href="/contact/">Contact</a></div></div>`;
const footer = `<footer class="site-footer"><div class="footer-grid"><div><div class="brand footer-brand"><span class="brand-mark">A</span><span><strong>ASAS</strong><small>Clarity in difficult family systems</small></span></div><p>Educational information about adult sibling alienation, vulnerable-parent safeguards, family systems and professional awareness.</p></div><div><h2>Explore</h2><a href="/">Home</a><a href="/start-here/">Start Here</a><a href="/resources/">Resources</a><a href="/articles/">Insights</a></div><div><h2>Connect</h2><a href="/contact/">Contact</a><a href="/share-your-story/">Share Your Story</a><a href="/updates/">Updates</a></div><div><h2>Important</h2><a href="/disclaimer/">Disclaimer</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></div></div><div class="footer-bottom"><span>© 2026 ASAS. Educational resource only.</span><span>Powered by ServiceUp.</span></div></footer>`;
function documentHtml(entry, type, body, route) {
  const d = entry.data || {}, title = d.seo_title || `${entry.title} | ASAS`, description = d.seo_description || d.summary || '', canonical = d.canonical_url || `${siteUrl}${route}`;
  const schema = { '@context':'https://schema.org', '@type': type === 'article' ? 'Article' : 'WebPage', headline:entry.title, name:entry.title, description, url:canonical, inLanguage:'en-US' };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${attr(description)}"><link rel="canonical" href="${attr(canonical)}"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(description)}"><meta property="og:url" content="${attr(canonical)}"><meta property="og:type" content="${type === 'article' ? 'article' : 'website'}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#f2c94c"><link rel="stylesheet" href="/assets/css/site.css?v=${assetVersion}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head><body><a class="skip-link" href="#main-content">Skip to content</a>${nav}<main id="main-content">${body}</main>${footer}<script defer src="/assets/js/site.js?v=${assetVersion}"></script>${type === 'assessment' ? `<script defer src="/assets/js/serviceup-static.js?v=${assetVersion}"></script>` : ''}</body></html>`;
}

async function loadContent() {
  if (exportFile) {
    const manifest = JSON.parse(await fs.readFile(path.resolve(exportFile), 'utf8'));
    for (const type of types) collections.set(type, (manifest.entries || []).filter(entry => entry.content_type_slug === type && entry.status === 'published'));
    return;
  }
  await Promise.all(types.map(async type => {
    const response = await fetch(`${api}/api/content/${encodeURIComponent(type)}`, {headers:{Accept:'application/json',Origin:siteUrl}});
    if (!response.ok) throw new Error(`ServiceUp ${type} request failed: ${response.status}`);
    const value = await response.json();
    collections.set(type, (Array.isArray(value) ? value : value.data || value.entries || []).filter(entry => entry.status === 'published'));
  }));
}
async function copyDir(source, destination, filter = () => true) {
  await fs.mkdir(destination, {recursive:true});
  for (const item of await fs.readdir(source, {withFileTypes:true})) {
    if (!filter(item, source)) continue;
    const from = path.join(source, item.name), to = path.join(destination, item.name);
    if (item.isDirectory()) await copyDir(from, to, filter); else await fs.copyFile(from, to);
  }
}
async function writeRoute(route, html) {
  const directory = route === '/' ? out : path.join(out, route.replace(/^\//, '').replace(/\/$/, ''));
  await fs.mkdir(directory, {recursive:true});
  await fs.writeFile(path.join(directory, 'index.html'), html);
}
async function backupLegacy() {
  const destination = path.join(out, legacyBase.slice(1));
  const excluded = new Set(['.git','dist','scripts','netlify.toml','package.json','package-lock.json','serviceup']);
  await copyDir(root, destination, item => !excluded.has(item.name) && item.name !== 'assets');
  for (const file of await walkHtml(destination)) {
    let html = await fs.readFile(file, 'utf8');
    if (/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html)) html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,nofollow,noarchive">');
    else html = html.replace(/<head([^>]*)>/i, '<head$1><meta name="robots" content="noindex,nofollow,noarchive">');
    html = html.replace(/<a([^>]+href=")\/(?!\/|assets\/)/g, `<a$1${legacyBase}/`);
    await fs.writeFile(file, html);
  }
}
async function walkHtml(directory) {
  const output = [];
  for (const item of await fs.readdir(directory, {withFileTypes:true})) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) output.push(...await walkHtml(full)); else if (item.name.endsWith('.html')) output.push(full);
  }
  return output;
}
async function main() {
  await fs.rm(out, {recursive:true,force:true});
  await fs.mkdir(out, {recursive:true});
  const assetHash = crypto.createHash('sha256');
  for (const file of ['assets/css/site.css','assets/js/site.js','assets/js/serviceup-static.js']) assetHash.update(await fs.readFile(path.join(root, file)));
  assetVersion = assetHash.digest('hex').slice(0, 12);
  await loadContent();
  await copyDir(path.join(root, 'assets'), path.join(out, 'assets'));
  await backupLegacy();
  const generated = [];
  for (const type of ['page','article','story','assessment','case-study','resource','update']) {
    for (const entry of entries(type)) {
      const d = entry.data || {}, panels = d.panels?.panels || [];
      const route = entryPath(entry, type);
      if (/^(https?:|mailto:|tel:|#)/.test(route)) continue;
      const body = type === 'article' ? renderArticle(entry) : type === 'assessment' && d.questions?.length ? renderAssessment(entry) : (panels.map((item, index) => `${index ? divider(item.data?.theme) : ''}${panel(item)}`).join('') || `<section class="section light-section"><div class="container prose"><h1>${esc(entry.title)}</h1>${rich(d.body)}</div></section>`);
      await writeRoute(route, documentHtml(entry, type, body, route));
      generated.push(route);
    }
  }
  const notFound = {title:'Page not found',data:{seo_title:'Page not found | ASAS',seo_description:'The requested ASAS page could not be found.'}};
  await fs.writeFile(path.join(out, '404.html'), documentHtml(notFound, 'page', '<section class="error-page"><div class="container narrow"><p class="eyebrow">404</p><h1>Page not found</h1><p>The page you requested could not be found.</p><a class="btn yellow" href="/">Return home</a></div></section>', '/404'));
  await fs.writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${legacyBase}/\nSitemap: ${siteUrl}/sitemap.xml\n`);
  await fs.writeFile(path.join(out, '_headers'), `${legacyBase}/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n\n/assets/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);
  await fs.writeFile(path.join(out, '_redirects'), `/legacy-reference-2026 /legacy-reference-2026/ 301\n/serviceup / 301\n/serviceup/ / 301\n/serviceup/* /:splat 301\n/404 /404.html 404\n`);
  const urls = generated.filter(route => route !== '/thank-you-contact/').map(route => `<url><loc>${siteUrl}${route}</loc></url>`).join('');
  await fs.writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  await fs.writeFile(path.join(out, 'serviceup-cache-manifest.json'), JSON.stringify({generated_at:new Date().toISOString(),api,route_count:generated.length,routes:generated}, null, 2));
  console.log(`Generated ${generated.length} ServiceUp pages in ${out}`);
}
await main();
