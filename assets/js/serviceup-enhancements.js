/* ASAS ServiceUp preview enhancements: accent heading, original articles artwork, article images.
 * Does not alter the live site or require ServiceUp database changes.
 */
(() => {
  'use strict';
  const base = '/serviceup';
  const originalImages = {
    'what-to-do-when-alienating-sibling-attacks': 'pexels-nabilnaidu-37949614.jpg',
    'common-mistakes-targeted-siblings-make': 'pexels-traphitho-11179951.jpeg',
    '17-things-alienator-hopes-you-never-figure-out': 'pexels-anna-romanova-1406375-13749427.jpeg',
    'coalition-around-alienator': 'pexels-ozuks-19797160.jpg',
    'community-around-alienated': 'pexels-zero-21050936.jpeg',
    'how-alienation-happens': 'pexels-deklansor-67-105200005-9587176.jpeg',
    'alienation-unmasked': 'pexels-anna-romanova-1406375-13749427.jpeg',
    'church-culture-narrative-vulnerability': 'pexels-ozuks-19797160.jpg',
    'personality-trait-cluster': 'pexels-zero-21050936.jpeg',
    'primary-drivers-of-alienation': 'pexels-deklansor-67-105200005-9587176.jpeg',
    'companion-pages': 'pexels-anna-romanova-1406375-13749427.jpeg',
    'psychological-factors': 'pexels-ozuks-19797160.jpg',
    'worst-case-asas-profile': 'pexels-zero-21050936.jpeg',
    'favorite-to-only-child-fantasies': 'pexels-deklansor-67-105200005-9587176.jpeg'
  };
  const route = location.pathname.replace(/^\/serviceup\/?/, '').replace(/^\/|\/$/g, '');
  const onArticles = route === 'articles';
  const onHome = route === '' || route === 'home';
  const api = String(window.ASAS_SERVICEUP?.apiBase || '').replace(/\/$/, '');
  let heroData;
  let articleRecords;
  const articleSlug = href => {
    try { return new URL(href, location.origin).pathname.match(/\/articles\/([^/]+)\/?$/)?.[1] || ''; }
    catch { return ''; }
  };
  const getEntries = async type => {
    if (!api) return [];
    const response = await fetch(`${api}/api/content/${encodeURIComponent(type)}`, {headers:{Accept:'application/json'}});
    if (!response.ok) return [];
    const result = await response.json();
    return Array.isArray(result) ? result : result.data || result.entries || [];
  };
  const loadData = async () => {
    try {
      if (onHome || onArticles) {
        const pages = await getEntries('page');
        const page = pages.find(p => p.slug === (onHome ? 'home' : 'articles'));
        heroData = (page?.data?.panels?.panels || []).find(p => p.type === 'hero')?.data;
      }
      if (onArticles) articleRecords = await getEntries('article');
    } catch (err) { console.warn('ASAS preview enhancement data unavailable:', err); }
    enhance();
  };
  let active = false;
  function enhance() {
    if (active) return;
    active = true;
    try {
      const hero = document.querySelector('#main-content .hero');
      if (hero) {
        if (onArticles) {
          hero.classList.add('hero-yellow');
          hero.style.setProperty('--hero-image', "url('/assets/img/pexels-javierdiazg-72456.jpg')");
        }
        if (onHome) {
          const h1 = hero.querySelector('h1');
          if (h1) {
            const rawHeading = String(heroData?.heading || h1.textContent || '').trim();
            let accent = String(heroData?.heading_accent || '').trim();
            let heading = rawHeading;
            if (!accent && /\s*\(ASAS\)$/.test(heading)) {
              heading = heading.replace(/\s*\(ASAS\)$/, '').trim();
              accent = '(ASAS)';
            }
            const position = heroData?.accent_position || 'after';
            if (accent && position !== 'hidden') {
              // MutationObserver watches #main-content, including this heading.
              // Only change the DOM if it differs from the desired result;
              // otherwise each replacement triggers another observer callback forever.
              const before = position === 'before';
              const targetText = before ? `${accent} ${heading}` : `${heading} ${accent}`;
              const existingAccent = h1.querySelector(':scope > span.accent');
              if (h1.textContent !== targetText || !existingAccent ||
                  existingAccent.textContent !== accent ||
                  (before ? h1.firstElementChild !== existingAccent : h1.lastElementChild !== existingAccent)) {
                const span = document.createElement('span');
                span.className = 'accent';
                span.textContent = accent;
                h1.replaceChildren();
                if (before) {
                  h1.append(span, document.createTextNode(' ' + heading));
                } else {
                  h1.append(document.createTextNode(heading + ' '), span);
                }
              }
            } else if (accent && position === 'hidden' && h1.textContent !== heading) {
              h1.textContent = heading;
            }
          }
        }
      }
      if (onArticles) {
        document.querySelectorAll('#main-content .serviceup-collection .article-card').forEach(card => {
          if (card.querySelector('img')) return;
          const link = card.querySelector('a[href]');
          const slug = articleSlug(link?.getAttribute('href'));
          if (!slug) return;
          const record = articleRecords?.find(e => e.slug === slug || e.slug === 'articles-' + slug);
          const d = record?.data || {};
          const url = d.featured_image || d.featured_image_url || d.image || d.hero_image || (originalImages[slug] ? '/assets/img/' + originalImages[slug] : '');
          if (!url || typeof url !== 'string') return;
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.src = url;
          img.alt = d.featured_image_alt || card.querySelector('h2')?.textContent || 'Article image';
          card.insertBefore(img, card.firstChild);
        });
      }
    } finally { active = false; }
  }
  const main = document.querySelector('#main-content');
  if (main) new MutationObserver(enhance).observe(main, {childList:true, subtree:true});
  loadData();
})();
