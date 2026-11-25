(()=>{
  const body=document.body;
  const toggle=document.querySelector('[data-menu-toggle]');
  const menu=document.querySelector('[data-mobile-menu]');

  function closeAccordions(){
    menu?.querySelectorAll('.mobile-nav-parent[aria-expanded="true"]').forEach(button=>{
      button.setAttribute('aria-expanded','false');
      const panel=document.getElementById(button.getAttribute('aria-controls'));
      if(panel) panel.hidden=true;
    });
  }

  function setMenu(open){
    if(!toggle||!menu)return;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    menu.classList.toggle('open',open);
    menu.setAttribute('aria-hidden',String(!open));
    body.classList.toggle('menu-open',open);
    if(open){
      menu.scrollTop=0;
      setTimeout(()=>menu.querySelector('a,button')?.focus(),20);
    }else{
      closeAccordions();
    }
  }

  toggle?.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

  menu?.addEventListener('click',e=>{
    const parent=e.target.closest('.mobile-nav-parent');
    if(parent){
      const open=parent.getAttribute('aria-expanded')==='true';
      const panel=document.getElementById(parent.getAttribute('aria-controls'));
      parent.setAttribute('aria-expanded',String(!open));
      if(panel) panel.hidden=open;
      return;
    }
    if(e.target.closest('a')) setMenu(false);
  });

  // Desktop search expands from the magnifying-glass button. Mobile search is
  // always visible at the top of the navigation menu.
  const navSearch=document.querySelector('[data-nav-search]');
  const searchToggle=document.querySelector('[data-search-toggle]');
  const desktopSearchInput=document.querySelector('#desktop-site-search');
  function setSearch(open){
    if(!navSearch||!searchToggle)return;
    navSearch.classList.toggle('open',open);
    searchToggle.setAttribute('aria-expanded',String(open));
    if(open)setTimeout(()=>desktopSearchInput?.focus(),20);
  }
  searchToggle?.addEventListener('click',event=>{
    event.stopPropagation();
    setSearch(!navSearch.classList.contains('open'));
  });
  navSearch?.addEventListener('click',event=>event.stopPropagation());
  document.addEventListener('click',()=>setSearch(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setSearch(false)});

  // Static, privacy-friendly site search. The index is regenerated from every
  // published ServiceUp entry during each Netlify build.
  const resultsHost=document.querySelector('[data-search-results]');
  const searchStatus=document.querySelector('[data-search-status]');
  const pageSearchInput=document.querySelector('#site-search-query');
  if(resultsHost&&searchStatus&&pageSearchInput){
    const params=new URLSearchParams(location.search);
    const query=String(params.get('q')||'').trim();
    pageSearchInput.value=query;
    const normalize=value=>String(value||'').toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
    const excerpt=(item,terms)=>{
      const source=String(item.summary||item.text||'').replace(/\s+/g,' ').trim();
      if(!source)return 'Open this page to learn more.';
      const lower=normalize(source);
      const first=terms.map(term=>lower.indexOf(term)).filter(index=>index>=0).sort((a,b)=>a-b)[0]??0;
      const start=Math.max(0,first-70);
      const text=source.slice(start,start+220).trim();
      return `${start?'…':''}${text}${start+220<source.length?'…':''}`;
    };
    const renderResults=async()=>{
      if(!query){
        searchStatus.textContent='Enter a word or phrase to search the ASAS website.';
        return;
      }
      searchStatus.textContent='Searching…';
      try{
        const response=await fetch('/search-index.json',{headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error(`Search index request failed: ${response.status}`);
        const index=await response.json();
        const terms=[...new Set(normalize(query).split(/[^a-z0-9]+/).filter(term=>term.length>1))];
        const ranked=index.map(item=>{
          const title=normalize(item.title),summary=normalize(item.summary),text=normalize(item.text);
          if(!terms.length||!terms.every(term=>title.includes(term)||summary.includes(term)||text.includes(term)))return null;
          const score=terms.reduce((total,term)=>total+(title.includes(term)?12:0)+(summary.includes(term)?5:0)+(text.includes(term)?1:0),0);
          return {...item,score};
        }).filter(Boolean).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,60);

        resultsHost.replaceChildren();
        searchStatus.textContent=ranked.length===1?'1 result found.':`${ranked.length} results found.`;
        if(!ranked.length){
          const empty=document.createElement('div');
          empty.className='search-empty';
          empty.innerHTML='<h2>No matches yet</h2><p>Try a shorter phrase or broader term such as “family,” “caregiving,” “isolation,” or “Anna.”</p>';
          resultsHost.append(empty);
          return;
        }
        for(const item of ranked){
          const link=document.createElement('a');
          link.className='search-result';
          link.href=item.url;
          const type=document.createElement('span');
          type.className='search-result-type';
          type.textContent=item.type||'Page';
          const heading=document.createElement('h2');
          heading.textContent=item.title;
          const description=document.createElement('p');
          description.textContent=excerpt(item,terms);
          link.append(type,heading,description);
          resultsHost.append(link);
        }
      }catch(error){
        console.error(error);
        searchStatus.textContent='Search is temporarily unavailable. Please try again.';
      }
    };
    renderResults();
  }

  // Reveal content a little before it enters the viewport. Very tall content blocks
  // (FAQ/prose pages) are shown immediately so they can never remain invisible
  // simply because a percentage-based intersection threshold is unreachable.
  const revealEls=[...document.querySelectorAll('.reveal')];
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}
  }),{threshold:0,rootMargin:'0px 0px 18% 0px'});
  revealEls.forEach(el=>{
    if(el.getBoundingClientRect().height > innerHeight*1.15){
      el.classList.add('in-view');
    }else{
      io.observe(el);
    }
  });

  // Netlify assessment gate: submit the form in the background, then perform a
  // normal GET navigation to the clean assessment URL. A direct HTML form POST
  // to /assessment-access/ can reach the site's 404 even though a later GET to
  // that same URL works correctly.
  const assessmentGate=document.querySelector('form.assessment-gate[data-netlify="true"]');
  if(assessmentGate){
    assessmentGate.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=assessmentGate.querySelector('button[type="submit"]');
      const originalText=submit?.textContent;
      if(submit){submit.disabled=true;submit.textContent='Opening assessment…';}

      try{
        const data=new FormData(assessmentGate);
        const response=await fetch('/',{
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:new URLSearchParams(data).toString()
        });
        if(!response.ok) throw new Error(`Netlify form submission failed: ${response.status}`);
        window.location.assign(assessmentGate.dataset.success||'/assessment-access/');
      }catch(error){
        console.error(error);
        if(submit){submit.disabled=false;submit.textContent=originalText||'Access assessment';}
        let message=assessmentGate.querySelector('.form-error');
        if(!message){
          message=document.createElement('p');
          message.className='form-error';
          message.setAttribute('role','alert');
          assessmentGate.append(message);
        }
        message.textContent='We could not open the assessment. Please try again.';
      }
    });
  }

  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const els=[...document.querySelectorAll('.parallax img')];
    let ticking=false;
    function update(){
      const h=innerHeight;
      els.forEach(img=>{
        const r=img.parentElement.getBoundingClientRect();
        const p=(r.top-h)/(h+r.height);
        img.style.transform=`translateY(${Math.max(-20,Math.min(20,p*30))}px) scale(1.06)`;
      });
      ticking=false;
    }
    addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});
    update();
  }
})();
