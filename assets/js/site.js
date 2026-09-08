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
