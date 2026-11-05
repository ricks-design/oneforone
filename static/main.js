const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Burger / Mobile-Menü */
(function(){
  const b=document.getElementById('burger'),m=document.getElementById('mobileMenu'),c=document.getElementById('mmClose');
  if(!b||!m)return;
  const open=()=>{m.classList.add('open');b.setAttribute('aria-expanded','true');document.body.style.overflow='hidden'};
  const close=()=>{m.classList.remove('open');b.setAttribute('aria-expanded','false');document.body.style.overflow=''};
  b.addEventListener('click',open);if(c)c.addEventListener('click',close);
  m.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();

/* Counter */
(function(){
  const els=document.querySelectorAll('.counter');if(!els.length)return;
  const io=new IntersectionObserver(es=>{es.forEach(en=>{
    if(!en.isIntersecting)return;const el=en.target,t=+el.dataset.target;io.unobserve(el);
    if(reduced){el.textContent=t.toLocaleString('de-DE');return}
    const t0=performance.now();(function tick(n){const p=Math.min((n-t0)/1400,1);
      el.textContent=Math.round(t*(1-Math.pow(1-p,3))).toLocaleString('de-DE');
      if(p<1)requestAnimationFrame(tick)})(t0);
  })},{threshold:.4});
  els.forEach(c=>io.observe(c));
})();

/* Wachstums-Balken */
(function(){
  const bars=document.querySelectorAll('.gbar .fill');if(!bars.length)return;
  const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.style.height=en.target.dataset.h;io.unobserve(en.target)}})},{threshold:.4});
  bars.forEach(b=>io.observe(b));
})();

/* Geldfluss-Balken */
(function(){
  const bars=document.querySelectorAll('.stackbar i');if(!bars.length)return;
  bars.forEach(b=>{b.dataset.w=b.style.width;if(!reduced)b.style.width='0'});
  const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.style.width=en.target.dataset.w;io.unobserve(en.target)}})},{threshold:.5});
  bars.forEach(b=>io.observe(b));
})();

/* FAQ + evtl. Akkordeon */
document.querySelectorAll('.faq-item').forEach(it=>{
  const q=it.querySelector('.faq-q'),a=it.querySelector('.faq-a');
  q.addEventListener('click',()=>{const open=it.classList.toggle('open');a.style.maxHeight=open?a.scrollHeight+'px':null});
});

/* IBAN kopieren */
function copyIban(btn){
  const el=document.getElementById('iban');if(!el)return;
  navigator.clipboard.writeText(el.textContent.replace(/\s/g,''));
  const o=btn.textContent;btn.textContent='Kopiert ✓';setTimeout(()=>btn.textContent=o,1800);
}
window.copyIban=copyIban;

/* Wirkungsrechner */
(function(){
  // Stufen aus content/einstellungen.yml (Feld „wirkungsrechner“)
  let STUFEN=[];try{STUFEN=JSON.parse(document.getElementById('rechner-data').textContent)}catch(e){}
  function impact(v){
    const s=STUFEN.find(x=>v>=x.von&&v<=x.bis);if(!s)return'';
    const l=[[s.icon||'',s.text||'']];
    if(s.alternativ)l.push([s.alternativ_icon||'','Oder: '+s.alternativ]);
    return l.map(x=>'<div class="line"><span class="ico">'+x[0]+'</span><span>'+x[1]+'</span></div>').join('');}
  document.querySelectorAll('.impact-slider').forEach(slider=>{
    const box=slider.closest('.calc-box');if(!box)return;
    const amountEl=box.querySelector('[id^="amount"]'),resultEl=box.querySelector('[id^="result"]');
    const presets=box.querySelectorAll('.preset');
    function upd(v){amountEl.textContent=v;resultEl.innerHTML=impact(+v);presets.forEach(p=>p.classList.toggle('active',+p.dataset.v===+v));}
    slider.addEventListener('input',e=>upd(e.target.value));
    presets.forEach(p=>p.addEventListener('click',()=>{slider.value=p.dataset.v;upd(p.dataset.v)}));
    upd(slider.value);
  });
})();

/* Generische Lightbox für alle .lbgroup (Galerie + Bildreihen) */
(function(){
  const groups=[...document.querySelectorAll('.lbgroup')].map(g=>[...g.querySelectorAll('figure')]).filter(a=>a.length);
  if(!groups.length)return;
  const lb=document.createElement('div');lb.className='lightbox';
  lb.innerHTML='<button class="lb-close" aria-label="Schließen">✕</button><button class="lb-nav prev" aria-label="Zurück">‹</button><img alt=""><button class="lb-nav next" aria-label="Weiter">›</button><div class="lb-cap"></div>';
  document.body.appendChild(lb);
  const img=lb.querySelector('img'),cap=lb.querySelector('.lb-cap');
  let cur=[],i=0;
  const capOf=f=>f.dataset.cap||(f.querySelector('figcaption')?f.querySelector('figcaption').textContent:'');
  const show=()=>{const f=cur[i],im=f.querySelector('img');img.src=im.src;img.alt=im.alt||'';cap.textContent=capOf(f);lb.classList.add('open');document.body.style.overflow='hidden'};
  const open=(slides,n)=>{cur=slides;i=(n+slides.length)%slides.length;show()};
  const close=()=>{lb.classList.remove('open');document.body.style.overflow=''};
  groups.forEach(slides=>slides.forEach((f,n)=>{
    f.style.cursor='zoom-in';f.setAttribute('tabindex','0');
    f.addEventListener('click',()=>open(slides,n));
    f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(slides,n)}});
  }));
  lb.querySelector('.lb-close').addEventListener('click',close);
  lb.querySelector('.lb-nav.next').addEventListener('click',e=>{e.stopPropagation();i=(i+1)%cur.length;show()});
  lb.querySelector('.lb-nav.prev').addEventListener('click',e=>{e.stopPropagation();i=(i-1+cur.length)%cur.length;show()});
  lb.addEventListener('click',e=>{if(e.target===lb)close()});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight'){i=(i+1)%cur.length;show()}if(e.key==='ArrowLeft'){i=(i-1+cur.length)%cur.length;show()}});
})();

/* Back-to-top */
(function(){
  const b=document.getElementById('toTop');if(!b)return;
  const on=()=>b.classList.toggle('show',scrollY>500);
  addEventListener('scroll',on,{passive:true});on();
  b.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
})();

/* Startseiten-Kacheln: Pop-up mit Kurzübersicht + Link zur Unterseite */
(function(){
  const tiles=document.querySelectorAll('.tile[data-modal]');if(!tiles.length)return;
  const MODALS=(()=>{try{return JSON.parse(document.getElementById('modal-data').textContent)}catch(e){return{}}})(); // Inhalte aus content/seiten/index.yml (Block „projektkacheln“)
  const bd=document.createElement('div');bd.className='modal-backdrop';
  bd.innerHTML='<div class="modal" role="dialog" aria-modal="true"><button class="m-close" aria-label="Schließen">✕</button><div class="m-body"></div></div>';
  document.body.appendChild(bd);
  const box=bd.querySelector('.m-body');let last=null;
  const close=()=>{bd.classList.remove('open');document.body.style.overflow='';if(last)last.focus()};
  tiles.forEach(t=>t.addEventListener('click',()=>{
    const m=MODALS[t.dataset.modal];if(!m)return;last=t;
    box.innerHTML=(m.img?'<img class="m-img" src="'+m.img+'" alt="">':'')
      +'<div class="m-inner"><h3>'+m.title+'</h3>'+m.body
      +'<a class="m-link" href="'+m.href+'">'+m.label+' →</a></div>';
    bd.classList.add('open');document.body.style.overflow='hidden';
    bd.querySelector('.m-close').focus();
  }));
  bd.querySelector('.m-close').addEventListener('click',close);
  bd.addEventListener('click',e=>{if(e.target===bd)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&bd.classList.contains('open'))close()});
})();
