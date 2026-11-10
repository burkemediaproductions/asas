(() => {
  const cfg=window.ASAS_SERVICEUP||{};
  const api=String(cfg.apiBase||'').replace(/\/$/,'');
  const base=String(cfg.basePath||'/serviceup').replace(/\/$/,'');
  const main=document.querySelector('#main-content');
  const types=['page','article','story','assessment','case-study','resource','update','faq-item','glossary-term'];
  const cache=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr=esc;
  const staged=url=>{
    if(!url)return '';
    if(/^https?:|^mailto:|^tel:|^#/.test(url))return url;
    const clean=url.replace(/\.html(?=($|[?#]))/,'').replace(/\/index(?=($|[?#]))/,'/');
    if(clean.startsWith('/assets/')||clean.startsWith('/.netlify/'))return clean;
    return `${base}${clean.startsWith('/')?'':'/'}${clean}`.replace(/\/$/,'')+'/';
  };
  const fetchType=slug=>{
    if(!cache.has(slug))cache.set(slug,fetch(`${api}/api/content/${encodeURIComponent(slug)}`,{headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error(`${slug}: ${r.status}`);return r.json()}).then(v=>Array.isArray(v)?v:(v.data||v.entries||[])));
    return cache.get(slug);
  };
  function rich(node){
    if(!node)return '';
    if(typeof node==='string')return esc(node);
    if(Array.isArray(node))return node.map(rich).join('');
    const body=rich(node.content||[]); const a=node.attrs||{};
    switch(node.type){
      case 'doc':return body; case 'text':{let t=esc(node.text||'');(node.marks||[]).forEach(m=>{if(m.type==='bold')t=`<strong>${t}</strong>`;if(m.type==='italic')t=`<em>${t}</em>`;if(m.type==='underline')t=`<u>${t}</u>`;if(m.type==='link')t=`<a href="${attr(staged(m.attrs?.href||''))}">${t}</a>`});return t}
      case 'paragraph':return `<p>${body}</p>`;case 'heading':return `<h${a.level||2}>${body}</h${a.level||2}>`;case 'bulletList':return `<ul>${body}</ul>`;case 'orderedList':return `<ol>${body}</ol>`;case 'listItem':return `<li>${body}</li>`;case 'blockquote':return `<blockquote>${body}</blockquote>`;case 'hardBreak':return '<br>';case 'horizontalRule':return '<hr>';case 'codeBlock':return `<pre><code>${body}</code></pre>`;default:return body;
    }
  }
  const divider=theme=>`<div aria-hidden="true" class="section-divider ${theme==='dark'?'dark':theme==='yellow'?'yellow':'light'}"></div>`;
  const themeClass=t=>t==='dark'?'dark-section':t==='yellow'?'yellow-section':'light-section';
  const buttons=d=>{const out=[];if(d.primary_label)out.push(`<a class="btn yellow" href="${attr(staged(d.primary_url))}">${esc(d.primary_label)}</a>`);if(d.secondary_label)out.push(`<a class="btn ghost" href="${attr(staged(d.secondary_url))}">${esc(d.secondary_label)}</a>`);return out.length?`<div class="hero-actions">${out.join('')}</div>`:''};
  function renderHero(d){const bg=d.background_image?` style="--hero-image:url('${attr(d.background_image)}')"`:'';return `<section class="hero ${d.variant==='homepage'?'hero-home':''} ${d.variant==='yellow'?'hero-yellow':''}"${bg}><div class="hero-shade"></div><div class="container hero-content reveal"><p class="eyebrow">${esc(d.eyebrow)}</p><h1>${esc(d.heading)}</h1><p class="hero-copy">${esc(d.summary)}</p>${buttons(d)}</div></section>`}
  const card=c=>`<a class="info-card reveal" href="${attr(staged(c.url))}">${c.number?`<span class="card-icon">${esc(c.number)}</span>`:''}${c.eyebrow?`<span class="tag">${esc(c.eyebrow)}</span>`:''}<h3>${esc(c.title)}</h3><p>${esc(c.body)}</p>${c.label?`<span class="text-link">${esc(c.label)}</span>`:''}</a>`;
  function panel(p){const d=p.data||{},theme=themeClass(d.theme),head=`${d.eyebrow?`<p class="eyebrow">${esc(d.eyebrow)}</p>`:''}${d.heading?`<h2>${esc(d.heading)}</h2>`:''}`;
    if(p.type==='hero')return renderHero(d);
    if(p.type==='editorial_section')return `<section class="section ${theme}"><div class="container ${d.side_heading?'prose-grid':''}"><article class="prose reveal">${head}${rich(d.body)}</article>${d.side_heading?`<aside class="side-card reveal"><p class="eyebrow">${esc(d.side_eyebrow)}</p><h2>${esc(d.side_heading)}</h2>${rich(d.side_body)}${d.side_link_label?`<a class="text-link" href="${attr(staged(d.side_link_url))}">${esc(d.side_link_label)}</a>`:''}</aside>`:''}</div></section>`;
    if(p.type==='image_text')return `<section class="section ${theme}"><div class="container split ${d.image_side==='left'?'reverse':''}"><div class="reveal">${head}${rich(d.body)}${d.button_label?`<a class="text-link" href="${attr(staged(d.button_url))}">${esc(d.button_label)}</a>`:''}</div>${d.image?`<figure class="media-frame"><img loading="lazy" src="${attr(d.image)}" alt="${attr(d.image_alt)}"></figure>`:''}</div></section>`;
    if(p.type==='card_grid')return `<section class="section ${theme}"><div class="container"><div class="section-head reveal">${head}${rich(d.intro)}</div><div class="card-grid three">${(d.cards||[]).map(card).join('')}</div></div></section>`;
    if(p.type==='feature_grid')return `<section class="section ${theme}"><div class="container"><div class="section-head reveal">${head}${rich(d.intro)}</div><div class="story-grid">${(d.items||[]).map((x,i)=>`<article class="story-card ${i===0?'large ':''}reveal">${x.image?`<img loading="lazy" src="${attr(x.image)}" alt="${attr(x.image_alt)}">`:''}<div>${x.eyebrow?`<span class="tag">${esc(x.eyebrow)}</span>`:''}<h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><a href="${attr(staged(x.url))}">${esc(x.label||'Read more →')}</a></div></article>`).join('')}</div></div></section>`;
    if(p.type==='quote_cta')return `<section class="section ${theme} quote-section"><div class="container narrow reveal">${head}<blockquote>${esc(d.quote)}</blockquote>${rich(d.body)}${d.button_label?`<a class="btn yellow" href="${attr(staged(d.button_url))}">${esc(d.button_label)}</a>`:''}</div></section>`;
    if(p.type==='collection_grid')return `<section class="section ${theme}" data-collection="${attr(d.content_type)}"><div class="container"><div class="section-head reveal">${head}${rich(d.intro)}</div><div class="serviceup-collection" data-layout="${attr(d.layout)}"><p>Loading entries…</p></div></div></section>`;
    if(p.type==='contact_form')return `<section class="section ${theme}"><div class="container contact-grid"><div class="reveal">${head}${rich(d.intro)}${rich(d.notice)}</div><form class="contact-form" name="${attr(d.form_name||'contact')}" method="POST" data-netlify="true" action="${attr(d.success_url||'/thank-you-contact/')}" netlify><input type="hidden" name="form-name" value="${attr(d.form_name||'contact')}">${(d.fields||[]).map(f=>`<label>${esc(f.label)}${f.type==='textarea'?`<textarea name="${attr(f.name)}" ${f.required?'required':''}></textarea>`:`<input type="${attr(f.type||'text')}" name="${attr(f.name)}" ${f.required?'required':''}>`}</label>`).join('')}<button class="btn yellow" type="submit">${esc(d.button_label||'Submit')}</button></form></div></section>`;
    if(p.type==='assessment_tool')return `<section class="section ${theme}"><div class="container"><div class="section-head reveal">${head}${rich(d.intro)}</div><div class="callout"><p>This interactive assessment is being loaded from ServiceUp.</p><a class="btn yellow" href="${attr(staged('/assessment-access/'))}">${esc(d.access_button_label||'Open assessment')}</a>${d.download_url?` <a class="button secondary" href="${attr(d.download_url)}">${esc(d.download_label||'Download PDF')}</a>`:''}</div></div></section>`;
    if(p.type==='download')return `<section class="section ${theme}"><div class="container narrow reveal">${head}${rich(d.body)}<a class="btn yellow" href="${attr(d.file||d.url)}">${esc(d.button_label||'Download')}</a></div></section>`;
    return '';
  }
  function entryLink(e,type){if(type==='article')return `${base}/articles/${e.slug.replace(/^articles-/,'')}/`;if(type==='story')return e.slug==='justice-for-anna'?`${base}/justice-for-anna/`:`${base}/justice-for-anna/${e.slug.replace(/^justice-for-anna-/,'')}/`;if(type==='case-study')return `${base}/case-studies/${e.slug}/`;if(type==='resource'&&e.data?.url)return staged(e.data.url);if(type==='update')return `${base}/updates/${e.slug}/`;return `${base}/${e.slug}/`}
  function summary(e){const d=e.data||{};return d.summary||d.description||d.definition||d.answer||''}
  function dateValue(value){
    const raw=value&&typeof value==='object'?(value.utc||value.iso||value.value||value.date):value;
    const time=raw?Date.parse(raw):NaN;
    return Number.isFinite(time)?time:0;
  }
  function newestArticleFirst(a,b){
    const ad=a.data||{},bd=b.data||{};
    const primary=dateValue(b.published_at||bd.published_at||bd.publish_date)-dateValue(a.published_at||ad.published_at||ad.publish_date);
    if(primary)return primary;
    const created=dateValue(b.created_at||bd.created_at)-dateValue(a.created_at||ad.created_at);
    if(created)return created;
    return String(a.title||'').localeCompare(String(b.title||''),undefined,{numeric:true,sensitivity:'base'});
  }
  function articleBody(d){
    const body=d.body;
    const hasBody=body?.type==='doc'&&Array.isArray(body.content)&&body.content.some(node=>node.type!=='paragraph'||(node.content?.length||0)>0);
    if(hasBody)return body;
    return (d.panels?.panels||[]).find(item=>item.type==='editorial_section')?.data?.body||null;
  }
  function renderArticle(entry){
    const d=entry.data||{};
    const hero=renderHero({
      eyebrow:d.eyebrow||'Insight',
      heading:entry.title,
      summary:d.summary||'',
      background_image:d.hero_image||'',
      background_alt:d.hero_alt||'',
      variant:'standard',
      overlay:'dark'
    });
    const callout=d.callout_heading?`<aside class="side-card reveal">${d.callout_eyebrow?`<p class="eyebrow">${esc(d.callout_eyebrow)}</p>`:''}<h2>${esc(d.callout_heading)}</h2>${rich(d.callout_body)}${d.callout_link_label?`<a class="text-link" href="${attr(staged(d.callout_link_url))}">${esc(d.callout_link_label)}</a>`:''}</aside>`:'';
    return `${hero}${divider('light')}<section class="section light-section"><div class="container ${callout?'prose-grid':''}"><article class="prose reveal">${rich(articleBody(d))}</article>${callout}</div></section>`;
  }
  async function hydrateCollections(){for(const section of document.querySelectorAll('[data-collection]')){const type=section.dataset.collection,wrap=section.querySelector('.serviceup-collection'),layout=wrap.dataset.layout;try{let list=await fetchType(type);if(type==='article')list=[...list].sort(newestArticleFirst);if(layout==='accordion')wrap.innerHTML=list.map(e=>`<details class="faq"><summary>${esc(e.title)}<span>+</span></summary><div>${rich(e.data?.answer||e.data?.body||e.data?.description)}</div></details>`).join('');else if(layout==='glossary')wrap.className+=' glossary-list',wrap.innerHTML=list.map(e=>`<article class="glossary-item"><h2>${esc(e.title)}</h2>${rich(e.data?.definition||e.data?.description)}</article>`).join('');else wrap.className+=' article-grid',wrap.innerHTML=list.map(e=>`<article class="article-card reveal"><div>${type==='article'?`<p class="eyebrow">${esc(e.data?.eyebrow||'Insight')}</p>`:''}<h2>${esc(e.title)}</h2>${typeof summary(e)==='object'?rich(summary(e)):`<p>${esc(summary(e))}</p>`}<a class="text-link" href="${attr(entryLink(e,type))}">${esc(type==='article'?'Read article →':'Read more →')}</a></div></article>`).join('')}catch(err){wrap.innerHTML='<p>Entries could not be loaded.</p>';console.error(err)}}}
  function route(){let p=location.pathname.replace(new RegExp(`^${base}`),'').replace(/^\/|\/$/g,'');if(!p||p==='home')return {slug:'home',preferred:'page'};if(p==='assessment')return {slug:'assessment-access',preferred:'page'};const bits=p.split('/');if(bits[0]==='articles')return bits.length===1?{slug:'articles',preferred:'page'}:{slug:`articles-${bits.at(-1)}`,preferred:'article'};if(bits[0]==='justice-for-anna')return bits.length===1?{slug:'justice-for-anna',preferred:'story'}:{slug:`justice-for-anna-${bits.at(-1)}`,preferred:'story'};if(bits[0]==='professionals')return {slug:`professionals-${bits.at(-1)}`,preferred:'page'};if(bits[0]==='case-studies'&&bits.length>1)return {slug:bits.at(-1),preferred:'case-study'};if(bits[0]==='updates'&&bits.length>1)return {slug:bits.at(-1),preferred:'update'};return {slug:bits.at(-1),preferred:bits[0]==='ciem-16'?'assessment':'page'} }
  function assessment(entry){const d=entry.data||{},qs=d.questions||[];return `<section class="hero"${d.hero_image?` style="--hero-image:url('${attr(d.hero_image)}')"`:''}><div class="hero-shade"></div><div class="container hero-content"><p class="eyebrow">${esc(d.eyebrow||'Educational assessment')}</p><h1>${esc(entry.title)}</h1><p class="hero-copy">${esc(d.summary||d.intro||'Complete each item and calculate your educational score.')}</p></div></section>${divider('light')}<section class="section light-section"><div class="container"><form class="assessment-form" data-serviceup-assessment>${qs.map((q,i)=>`<fieldset class="assessment-section"><legend>${esc(q.category||`Question ${i+1}`)}</legend><div class="assessment-question"><p><strong>${esc(q.prompt)}</strong></p><div class="rating-options ${entry.slug==='ciem-16'?'four':''}">${Array.from({length:entry.slug==='ciem-16'?4:5},(_,v)=>`<label><input required type="radio" name="q${i}" value="${v}"><span>${v}</span><small>${entry.slug==='ciem-16'?['Not present','Mild','Moderate','Severe'][v]:['Never','Rarely','Sometimes','Often','Very Often'][v]}</small></label>`).join('')}</div></div></fieldset>`).join('')}<div class="assessment-actions"><button class="button primary" type="submit">Calculate score</button><button class="button secondary" type="reset">Reset</button></div><div class="assessment-results" hidden><p class="eyebrow">Educational score</p><div class="overall-score"><strong>Total</strong><span data-total>0</span><small>/ ${qs.length*(entry.slug==='ciem-16'?3:4)}</small></div><p>This score is educational and is not a clinical or legal diagnosis.</p></div></form></div></section>`}
  function bindAssessment(){const form=document.querySelector('[data-serviceup-assessment]');if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();const total=[...new FormData(form).values()].reduce((sum,v)=>sum+Number(v),0),results=form.querySelector('.assessment-results');form.querySelector('[data-total]').textContent=total;results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'center'})});form.addEventListener('reset',()=>{const results=form.querySelector('.assessment-results');results.hidden=true;form.querySelector('[data-total]').textContent='0'})}
  async function start(){if(!api){main.innerHTML='<section class="section light-section"><div class="container"><h1>ServiceUp API not configured</h1></div></section>';return}const r=route();try{const ordered=[r.preferred,...types.filter(x=>x!==r.preferred)];let entry=null,foundType='';for(const type of ordered){entry=(await fetchType(type)).find(e=>e.slug===r.slug);if(entry){foundType=type;break}}if(!entry)throw new Error('Entry not found');const d=entry.data||{},panels=d.panels?.panels||[];document.title=`${entry.title} | ASAS ServiceUp Preview`;document.querySelector('meta[name="description"]').content=d.seo_description||d.summary||'';main.innerHTML=foundType==='article'?renderArticle(entry):foundType==='assessment'&&d.questions?.length?assessment(entry):(panels.map((p,i)=>`${i?divider(p.data?.theme):''}${panel(p)}`).join('')||`<section class="section light-section"><div class="container prose"><h1>${esc(entry.title)}</h1>${rich(d.body)}</div></section>`);await hydrateCollections();bindAssessment();document.querySelectorAll('.reveal').forEach(x=>x.classList.add('in-view'))}catch(err){console.error(err);main.innerHTML=`<section class="error-page"><div class="container narrow"><p class="eyebrow">ServiceUp preview</p><h1>Page not available</h1><p>${esc(err.message)}</p><a class="btn yellow" href="${base}/">Preview homepage</a></div></section>`}}
  start();
})();
