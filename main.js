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

/* FAQ + Kinder-Akkordeon (gleiches Muster) */
document.querySelectorAll('.faq-item').forEach(it=>{
  const q=it.querySelector('.faq-q'),a=it.querySelector('.faq-a');
  q.addEventListener('click',()=>{const open=it.classList.toggle('open');a.style.maxHeight=open?a.scrollHeight+'px':null});
});
document.querySelectorAll('.sacc-item').forEach(it=>{
  const q=it.querySelector('.sacc-head'),a=it.querySelector('.sacc-body');
  q.addEventListener('click',()=>{const open=it.classList.toggle('open');a.style.maxHeight=open?a.scrollHeight+'px':null;q.setAttribute('aria-expanded',open)});
});

/* IBAN kopieren */
function copyIban(btn){
  const el=document.getElementById('iban');if(!el)return;
  navigator.clipboard.writeText(el.textContent.replace(/\s/g,''));
  const o=btn.textContent;btn.textContent='Kopiert ✓';setTimeout(()=>btn.textContent=o,1800);
}
window.copyIban=copyIban;

/* Wirkungsrechner – unterstützt mehrere Instanzen pro Seite */
(function(){
  function impact(v){const l=[];
    if(v<10){l.push(["🎒","<strong>Ein Term Schulgebühren</strong> für ein Kind (ab 8 €)"]);l.push(["📖","Examensgebühr + Schulbücher für ein Jahr"]);}
    else if(v<25){l.push(["🍲","<strong>"+Math.floor(v)+" Wochen Schulessen</strong> – Frühstück und Mittagessen (1 €/Woche)"]);l.push(["👞","Oder: ein Paar Schulschuhe + Rucksack"]);}
    else if(v<65){const k=Math.floor(v/25);l.push(["🏫","<strong>Ein Jahr Schulgebühren</strong> für "+(k===1?"ein Kind":k+" Kinder")+" (ab 25 €/Jahr)"]);l.push(["👕",v>=35?"Oder: eine <strong>komplette Schuluniform</strong> mit Schuhen und Rucksack":"Fast eine komplette Schuluniform (35 €)"]);}
    else if(v<100){l.push(["⭐","<strong>Ein komplettes Schuljahr</strong> für ein Kind – Gebühren, Essen und Material (ca. 65 €)"]);l.push(["🥣","Oder: Porridge-Zutaten für mehrere Samstage"]);}
    else{const f=Math.floor(v/65);l.push(["⭐","<strong>"+f+" "+(f===1?"komplettes Schuljahr":"komplette Schuljahre")+"</strong> – Gebühren, Essen und Material"]);l.push(["🪑","Oder: "+Math.floor(v/25)+" Schulbänke mit Stuhl fürs Klassenzimmer"]);}
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

/* Startseiten-Kacheln: Pop-up mit Kurzübersicht + Link zur Unterseite */
(function(){
  const tiles=document.querySelectorAll('.tile[data-modal]');if(!tiles.length)return;
  const MODALS={
    bibliotheken:{img:'bilder/kachel-bibliothek.jpg',title:'Die Büchereien',
      body:'<p>Im Februar 2025 haben wir in Korogocho auf rund 15 m² eine Bücherei eröffnet, am Ostermontag 2026 folgte eine zweite in Mathare. Beide stehen jedem Kind offen – unabhängig davon, ob es gerade zur Schule geht.</p><p>Neben Schulbüchern gibt es Märchen, einfache Romane und gespendete Spiele. Die Kinder machen hier Hausaufgaben, lernen gemeinsam oder spielen einfach.</p><div class="m-fact">Montag bis Samstag, 11–19 Uhr · Korogocho (Ngomongo) und Mathare North, Area 3</div>',
      href:'projekte.html#bibliotheken',label:'Mehr über die Büchereien'},
    schulbildung:{img:'bilder/kachel-schule.jpg',title:'Schulbildung',
      body:'<p>Obwohl Schule in Kenia seit 2003 offiziell kostenlos ist, sieht die Realität anders aus: zu wenige öffentliche Schulen, dazu Gebühren für Uniform, Prüfungen und Material.</p><p>Gemeinsam mit Teddy und Joseph haben wir einen Evaluationsbogen entwickelt, aus dem sich eine faire Warteliste ergibt. Ist ein Kind aufgenommen, begleiten wir es möglichst durch die ganze Schullaufbahn.</p><div class="m-fact">Aktuell zahlen wir die Schulgebühren für 237 Kinder an rund 50 verschiedenen Schulen.</div>',
      href:'projekte.html#schulbildung',label:'Mehr zur Schulbildung'},
    porridge:{img:'bilder/kachel-porridge.jpg',title:'Porridge-Programm',
      body:'<p>Mangelernährung ist in den Slums von Nairobi Alltag. Deshalb gibt es jeden Samstag in Ngomongo, Korogocho, eine Porridge-Ausgabe.</p><p>Was als Initiative des Teams vor Ort begann, versorgt heute 150 bis 250 Kinder pro Woche mit einer warmen Mahlzeit.</p><div class="m-fact">Zusätzlich hat das Team eine große Lebensmittelspende über Foodbank Kenya organisiert.</div>',
      href:'projekte.html#porridge',label:'Zum Porridge-Programm'},
    center:{img:'bilder/kachel-center.jpg',title:'Community Center',
      body:'<p>Dank einer Großspende konnten wir mitten im Herzen von Korogocho ein rund 400 m² großes Grundstück erwerben. Die Abrissarbeiten haben begonnen, ein zweiter Architekten-Entwurf wird ausgearbeitet.</p><p>Geplant sind Bibliothek, Unterrichtsraum, Nähraum, Küche, Büro, Toiletten, Spielraum und ein Außenbereich.</p><div class="m-fact">Im Bau-Tagebuch begleitet ihr jeden Schritt – vom Grundstück bis zur Eröffnung.</div>',
      href:'community-center.html',label:'Zum Bau-Tagebuch'},
    naehprojekt:{img:'bilder/kachel-naehen.jpg',title:'Nähprojekt',
      body:'<p>In einem Raum direkt neben der Bücherei in Korogocho nähen Maureen und Linet – das Nähen beigebracht hat den beiden Marion.</p><p>Heute arbeiten sie eigenständig und schaffen sich damit ein eigenes Einkommen.</p><div class="m-fact">Im künftigen Community Center bekommt das Nähprojekt einen eigenen, größeren Raum.</div>',
      href:'projekte.html#naehprojekt',label:'Mehr zum Nähprojekt'},
    hausaufgaben:{img:null,title:'Hausaufgabenbetreuung',
      body:'<p>Zuhause fehlt oft der Platz, das Licht oder die Ruhe zum Lernen. In unseren Büchereien finden die Kinder beides – und Menschen, die ihnen helfen.</p><p>Unsere Mentorinnen und Mentoren kommen selbst aus Korogocho und Mathare.</p><div class="m-fact">In den Schulferien bieten wir zusätzliche Nachhilfeprogramme an.</div>',
      href:'projekte.html#hausaufgaben',label:'Mehr erfahren'}
  };
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
