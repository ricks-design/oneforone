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

/* FAQ */
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
  const slider=document.getElementById('slider');if(!slider)return;
  const amountEl=document.getElementById('amount'),resultEl=document.getElementById('result');
  function impact(v){const l=[];
    if(v<10){l.push(["🎒","<strong>Ein Term Schulgebühren</strong> für ein Kind (ab 8 €)"]);l.push(["📖","Examensgebühr + Schulbücher für ein Jahr"]);}
    else if(v<25){l.push(["🍲","<strong>"+Math.floor(v)+" Wochen Schulessen</strong> – Frühstück und Mittagessen (1 €/Woche)"]);l.push(["👞","Oder: ein Paar Schulschuhe + Rucksack"]);}
    else if(v<65){const k=Math.floor(v/25);l.push(["🏫","<strong>Ein Jahr Schulgebühren</strong> für "+(k===1?"ein Kind":k+" Kinder")+" (ab 25 €/Jahr)"]);l.push(["👕",v>=35?"Oder: eine <strong>komplette Schuluniform</strong> mit Schuhen und Rucksack":"Fast eine komplette Schuluniform (35 €)"]);}
    else if(v<100){l.push(["⭐","<strong>Ein komplettes Schuljahr</strong> für ein Kind – Gebühren, Essen und Material (ca. 65 €)"]);l.push(["🥣","Oder: Porridge-Zutaten für mehrere Samstage"]);}
    else{const f=Math.floor(v/65);l.push(["⭐","<strong>"+f+" "+(f===1?"komplettes Schuljahr":"komplette Schuljahre")+"</strong> – Gebühren, Essen und Material"]);l.push(["🪑","Oder: "+Math.floor(v/25)+" Schulbänke mit Stuhl fürs Klassenzimmer"]);}
    return l.map(x=>'<div class="line"><span class="ico">'+x[0]+'</span><span>'+x[1]+'</span></div>').join('');}
  function upd(v){amountEl.textContent=v;resultEl.innerHTML=impact(+v);document.querySelectorAll('.preset').forEach(p=>p.classList.toggle('active',+p.dataset.v===+v));}
  slider.addEventListener('input',e=>upd(e.target.value));
  document.querySelectorAll('.preset').forEach(p=>p.addEventListener('click',()=>{slider.value=p.dataset.v;upd(p.dataset.v)}));
  upd(25);
})();

/* Galerie Lightbox */
(function(){
  const figs=[...document.querySelectorAll('#mosaic figure')];if(!figs.length)return;
  const lb=document.createElement('div');lb.className='lightbox';
  lb.innerHTML='<button class="lb-close" aria-label="Schließen">✕</button><button class="lb-nav prev" aria-label="Zurück">‹</button><img alt=""><button class="lb-nav next" aria-label="Weiter">›</button><div class="lb-cap"></div>';
  document.body.appendChild(lb);
  const img=lb.querySelector('img'),cap=lb.querySelector('.lb-cap');let i=0;
  const open=n=>{i=(n+figs.length)%figs.length;const f=figs[i];img.src=f.querySelector('img').src;img.alt=f.querySelector('img').alt;cap.textContent=f.dataset.cap||'';lb.classList.add('open');document.body.style.overflow='hidden'};
  const close=()=>{lb.classList.remove('open');document.body.style.overflow=''};
  figs.forEach((f,n)=>{f.addEventListener('click',()=>open(n));f.setAttribute('tabindex','0');f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(n)}})});
  lb.querySelector('.lb-close').addEventListener('click',close);
  lb.querySelector('.lb-nav.next').addEventListener('click',e=>{e.stopPropagation();open(i+1)});
  lb.querySelector('.lb-nav.prev').addEventListener('click',e=>{e.stopPropagation();open(i-1)});
  lb.addEventListener('click',e=>{if(e.target===lb)close()});
  document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')open(i+1);if(e.key==='ArrowLeft')open(i-1)});
})();
