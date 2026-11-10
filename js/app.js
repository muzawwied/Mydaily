(function(){
  var as=document.getElementById('as'),box=document.getElementById('asb');
  function hide(){as.hidden=true;box.innerHTML=''}
  var pw=document.getElementById('pmw'),pm=document.getElementById('pm');
  function hidePm(){pw.hidden=true;pm.innerHTML='';pm.style.top='';pm.style.right='';pm.style.left=''}
  window.popMenu=function(anchor,acts){
    pm.innerHTML='';
    acts.forEach(function(a){
      var b=document.createElement('button');b.type='button';b.className='pmi'+(a.d?' del':'');
      b.innerHTML='<span>'+a.l+'</span>';
      b.addEventListener('click',function(){hidePm();a.f()});pm.appendChild(b);
    });
    pw.hidden=false;
    var r=anchor.getBoundingClientRect(),h=pm.offsetHeight,top=r.bottom+4;
    if(top+h>window.innerHeight-12)top=Math.max(12,r.top-h-4);
    pm.style.top=top+'px';pm.style.right=Math.max(12,window.innerWidth-r.right)+'px';
  };
  window.sortMenu=function(opts,cur,cb){
    pm.innerHTML='<div class="pmt">Urutkan</div>';
    opts.forEach(function(o){
      var b=document.createElement('button');b.type='button';b.className='pmi'+(o[0]===cur?' on':'');
      b.innerHTML='<span>'+o[1]+'</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      b.addEventListener('click',function(){hidePm();cb(o[0])});pm.appendChild(b);
    });
    pw.hidden=false;
  };
  pw.addEventListener('click',function(e){if(e.target===pw)hidePm()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pw.hidden){hidePm();e.stopImmediatePropagation()}},true);
  window.PIN='<svg class="pinm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16v6M8 3h8l-1.500 6.500L18 13H6l3.500-3.500z"/></svg>';
  window.sheet=function(t,acts){
    var IC={pin:'<path d="M12 16v6M8 3h8l-1.500 6.500L18 13H6l3.500-3.500z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',done:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 8h-3"/>',del:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>'};
    box.innerHTML='';
    acts.concat([{l:'Tutup',i:'close',c:1,f:function(){}}]).forEach(function(a){
      var b=document.createElement('button');b.type='button';b.className='asa'+(a.d?' del':'')+(a.c?' cn':'');b.setAttribute('aria-label',a.l);
      b.innerHTML='<span class="ai"><svg viewBox="0 0 24 24" aria-hidden="true">'+IC[a.i]+'</svg></span><span>'+a.l+'</span>';
      b.addEventListener('click',function(){hide();a.f()});box.appendChild(b);
    });
    as.hidden=false;
  };
  as.addEventListener('click',function(e){if(e.target===as)hide()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!as.hidden){hide();e.stopImmediatePropagation()}},true);
  window.lp=function(list,sel,cb){
    var tm=0,fired=false,sx=0,sy=0;
    function stop(){clearTimeout(tm)}
    list.addEventListener('pointerdown',function(e){
      var el=e.target.closest(sel);if(!el||e.target.closest('[data-nolp]'))return;
      fired=false;sx=e.clientX;sy=e.clientY;stop();
      tm=setTimeout(function(){fired=true;try{if(navigator.vibrate)navigator.vibrate(15)}catch(x){}cb(el)},500);
    });
    list.addEventListener('pointermove',function(e){if(Math.abs(e.clientX-sx)>8||Math.abs(e.clientY-sy)>8)stop()});
    ['pointerup','pointercancel','pointerleave'].forEach(function(n){list.addEventListener(n,stop)});
    list.addEventListener('contextmenu',function(e){if(e.target.closest&&e.target.closest('[data-nolp]'))return;e.preventDefault()});
    list.addEventListener('click',function(e){if(fired){e.stopPropagation();e.preventDefault();fired=false}},true);
  };
})();
;
(function(){
  var bar=document.querySelector('.bar'),hero=document.querySelector('.hero');
  function s(){bar.style.setProperty('--hh',hero.offsetHeight+'px');bar.style.setProperty('--hw',hero.offsetWidth+'px')}
  s();window.addEventListener('resize',s);window.addEventListener('load',s);
  window.addEventListener('scroll',function(){bar.classList.toggle('on',window.scrollY>6)},{passive:true});
})();
document.querySelectorAll('.nb').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.nb').forEach(function(x){x.classList.remove('on')});b.classList.add('on')})});
;
window.PROFIL=(function(){
  var o={nama:'Vylonium',handle:'vylonium.vy',bio:'',foto:''};
  try{var s=JSON.parse(localStorage.getItem('profil'));if(s&&typeof s==='object'){if(typeof s.nama==='string'&&s.nama.trim())o.nama=s.nama.trim().slice(0,20);if(typeof s.handle==='string'&&s.handle)o.handle=s.handle.slice(0,20);if(typeof s.bio==='string')o.bio=s.bio.slice(0,80);if(typeof s.foto==='string'&&/^data:image\//.test(s.foto))o.foto=s.foto}}catch(e){}
  o.ini=function(){return (o.nama.trim().charAt(0)||'V').toUpperCase()};
  o.save=function(){try{localStorage.setItem('profil',JSON.stringify({nama:o.nama,handle:o.handle,bio:o.bio,foto:o.foto}));return true}catch(e){return false}};
  o.av=function(el,f,ini){var ft=f===undefined?o.foto:f;if(ft){el.textContent='';el.style.backgroundImage='url("'+ft+'")';el.style.backgroundSize='cover';el.style.backgroundPosition='center'}else{el.textContent=ini||o.ini();el.style.backgroundImage=''}};
  return o;
})();
(function(){
  function greet(){var h=new Date().getHours();var g=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';document.getElementById('greet').textContent=g+', '+PROFIL.nama+'!'}
  function paint(){
    document.querySelectorAll('[data-pav]').forEach(function(e){PROFIL.av(e)});
    document.querySelectorAll('[data-pn]').forEach(function(e){e.textContent=PROFIL.nama});
  }
  window.applyProfil=function(){greet();paint();document.dispatchEvent(new Event('profil'))};
  greet();paint();
  document.getElementById('dnum').textContent=new Date().getDate();
})();
(function(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var a=document.querySelector('.in'),b=document.querySelector('.sun'),sh=document.querySelector('.sheet'),t=false;
  function f(){var y=Math.max(0,window.scrollY);b.style.transform='translateY('+(-y*.15)+'px)';var r=Math.max(0,Math.min(22,sh.getBoundingClientRect().top));sh.style.borderRadius=r+'px '+r+'px 0 0';t=false}
  window.addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(f)}},{passive:true});
})();
(function(){
  var q=['Tidak apa-apa kalau hari ini terasa berat. Selesaikan satu hal kecil, dan kamu sudah menang.','Kamu tidak harus langsung hebat. Yang penting kamu mau mulai hari ini.','Jangan bandingkan bab satumu dengan bab dua puluh orang lain. Fokus pada langkahmu sendiri.','Pelan tidak apa-apa, asal tidak berhenti. Setiap hari yang kamu jalani membawamu lebih dekat.','Hari ini adalah halaman baru. Tulis sesuatu yang membuatmu bangga nanti malam.','Konsisten itu mengalahkan semangat sesaat. Lakukan sedikit, tapi lakukan setiap hari.'];
  var el=document.getElementById('quote'),i=Math.floor(Math.random()*q.length);
  try{var l=+localStorage.getItem('qi');if(i===l)i=(i+1)%q.length;localStorage.setItem('qi',i)}catch(e){}
  el.textContent=q[i];
})();
(function(){
  var P=[['s1','Mulai harimu dengan rapi','Susun tugas yang penting dulu.'],['s2','Jaga kebiasaan baikmu','Sedikit tiap hari, hasilnya terasa.'],['s3','Catat hal yang kamu syukuri','Tutup hari dengan hati tenang.'],['s4','Jangan lupa minum air','Segelas air di pagi hari bikin tubuh lebih segar.'],['s5','Istirahat sejenak','Rehat 5 menit setiap satu jam fokus.'],['s6','Bergerak sedikit','Jalan kaki 10 menit bantu pikiran lebih jernih.'],['s7','Tidur yang cukup','Tidur 7\u20138 jam bantu kamu fokus besok.'],['s8','Satu hal dulu','Selesaikan satu tugas sebelum pindah ke yang lain.'],['s9','Nikmati hari ini','Langkah kecil tetap berarti.'],['s10','Tenangkan pikiran','Tarik napas dalam sebelum mulai.'],['s11','Akhiri hari dengan tenang','Lepaskan lelah, besok mulai lagi.'],['s12','Hirup udara segar','Keluar sebentar, lihat langit dan tarik napas.']];
  var tr=document.getElementById('track');if(!tr)return;
  for(var k=P.length-1;k>0;k--){var r=Math.floor(Math.random()*(k+1)),t=P[k];P[k]=P[r];P[r]=t}
  try{var l=localStorage.getItem('bn');if(P[0][0]===l){P.push(P.shift())}localStorage.setItem('bn',P[0][0])}catch(e){}
  tr.innerHTML='';
  P.slice(0,3).forEach(function(x){var d=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p');d.className='slide '+x[0];h.textContent=x[1];p.textContent=x[2];d.appendChild(h);d.appendChild(p);tr.appendChild(d)});
})();
(function(){
  var tr=document.getElementById('track'),sl=tr.children,dots=document.getElementById('dots'),n=sl.length,i=0,hold=false;
  for(var k=0;k<n;k++)dots.appendChild(document.createElement('i'));
  function mark(){var w=sl[0].offsetWidth+6;i=Math.min(n-1,Math.round(tr.scrollLeft/w));for(var k=0;k<n;k++)dots.children[k].className=k===i?'on':''}
  tr.addEventListener('scroll',mark,{passive:true});
  tr.addEventListener('touchstart',function(){hold=true},{passive:true});
  tr.addEventListener('touchend',function(){setTimeout(function(){hold=false},3000)},{passive:true});
  mark();
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  setInterval(function(){if(hold)return;var j=(i+1)%n;tr.scrollTo({left:j===0?0:sl[j].offsetLeft-tr.offsetLeft,behavior:'smooth'})},4000);
})();
(function(){
  var M=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var D=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var H={'2026-01-01':'Tahun Baru 2026 Masehi','2026-01-16':'Isra Mikraj Nabi Muhammad SAW','2026-02-16':'Cuti Bersama Tahun Baru Imlek','2026-02-17':'Tahun Baru Imlek 2577 Kongzili','2026-03-18':'Cuti Bersama Hari Suci Nyepi','2026-03-19':'Hari Suci Nyepi (Tahun Baru Saka 1948)','2026-03-20':'Cuti Bersama Idulfitri','2026-03-21':'Hari Raya Idulfitri 1447 H','2026-03-22':'Hari Raya Idulfitri 1447 H','2026-03-23':'Cuti Bersama Idulfitri','2026-03-24':'Cuti Bersama Idulfitri','2026-04-03':'Wafat Yesus Kristus','2026-04-05':'Kebangkitan Yesus Kristus (Paskah)','2026-05-01':'Hari Buruh Internasional','2026-05-14':'Kenaikan Yesus Kristus','2026-05-15':'Cuti Bersama Kenaikan Yesus Kristus','2026-05-27':'Hari Raya Iduladha 1447 H','2026-05-28':'Cuti Bersama Iduladha','2026-05-31':'Hari Raya Waisak 2570 BE','2026-06-01':'Hari Lahir Pancasila','2026-06-16':'Tahun Baru Islam 1448 H','2026-08-17':'Proklamasi Kemerdekaan','2026-08-25':'Maulid Nabi Muhammad SAW','2026-12-24':'Cuti Bersama Natal','2026-12-25':'Kelahiran Yesus Kristus (Natal)',
    '2027-01-01':'Tahun Baru 2027 Masehi','2027-01-05':'Isra Mikraj Nabi Muhammad SAW','2027-02-05':'Cuti Bersama Tahun Baru Imlek','2027-02-06':'Tahun Baru Imlek 2578 Kongzili','2027-03-08':'Hari Suci Nyepi (Tahun Baru Saka 1949)','2027-03-09':'Cuti Bersama Idulfitri','2027-03-10':'Hari Raya Idulfitri 1448 H','2027-03-11':'Hari Raya Idulfitri 1448 H','2027-03-12':'Cuti Bersama Idulfitri','2027-03-15':'Cuti Bersama Idulfitri','2027-03-25':'Cuti Bersama Wafat Yesus Kristus','2027-03-26':'Wafat Yesus Kristus','2027-03-28':'Kebangkitan Yesus Kristus (Paskah)','2027-05-01':'Hari Buruh Internasional','2027-05-06':'Kenaikan Yesus Kristus','2027-05-17':'Hari Raya Iduladha 1448 H','2027-05-18':'Cuti Bersama Iduladha','2027-05-19':'Cuti Bersama Waisak','2027-05-20':'Hari Raya Waisak 2571 BE','2027-06-01':'Hari Lahir Pancasila','2027-06-06':'Tahun Baru Islam 1449 H','2027-08-15':'Maulid Nabi Muhammad SAW','2027-08-17':'Proklamasi Kemerdekaan','2027-12-24':'Cuti Bersama Natal','2027-12-25':'Kelahiran Yesus Kristus (Natal)','2027-12-26':'Isra Mikraj Nabi Muhammad SAW'};
  function key(d){var m=d.getMonth()+1,x=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(x<10?'0':'')+x}
  var cal=document.getElementById('cal'),grid=document.getElementById('calGrid'),title=document.getElementById('calTitle'),selTxt=document.getElementById('calSel'),hol=document.getElementById('calHol');
  var A={};try{A=JSON.parse(localStorage.getItem('agenda'))||{}}catch(e){A={}}
  function saveA(){try{localStorage.setItem('agenda',JSON.stringify(A))}catch(e){}}
  var tl=document.getElementById('calTl'),emp=document.getElementById('calEmpty');
  var now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var view=new Date(today.getFullYear(),today.getMonth(),1),sel=today;
  function same(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
  function render(){
    title.textContent=M[view.getMonth()]+' '+view.getFullYear();
    var first=(view.getDay()+6)%7,days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate(),rows=Math.ceil((first+days)/7),html='';
    for(var i=0;i<rows*7;i++){
      var d=new Date(view.getFullYear(),view.getMonth(),1-first+i);
      var c='day'+(d.getMonth()!==view.getMonth()?' out':'')+(same(d,today)?' today':'')+(same(d,sel)?' sel':'')+(d.getDay()===0||H[key(d)]?' red':'');
      html+='<button type="button" class="'+c+'" data-t="'+d.getTime()+'">'+d.getDate()+'</button>';
    }
    grid.innerHTML=html;
    selTxt.textContent=D[sel.getDay()]+', '+sel.getDate()+' '+M[sel.getMonth()]+' '+sel.getFullYear();
    var hn=H[key(sel)];hol.hidden=!hn;hol.textContent='';
    if(hn){var mm=hn.match(/^(.*?)\s*\((.*)\)$/);
      if(mm){hol.appendChild(document.createTextNode(mm[1]));var sp=document.createElement('span');sp.className='hs';sp.textContent=mm[2];hol.appendChild(sp)}
      else hol.textContent=hn}
    Array.prototype.slice.call(tl.querySelectorAll('.ev')).forEach(function(n){n.remove()});
    var evs=A[key(sel)]||[];
    evs.forEach(function(t,j){var e=document.createElement('div');e.className='tl-i ev';var o=typeof t==='string'?{t:t}:t;var s=document.createElement('span');
      var a1=document.createElement('div');a1.className='et';a1.textContent=o.t;s.appendChild(a1);
      if(o.j){var a2=document.createElement('div');a2.className='em';a2.textContent=o.j+(o.s?' \u2013 '+o.s:'');s.appendChild(a2)}
      if(o.c){var a3=document.createElement('div');a3.className='en';a3.textContent=o.c;s.appendChild(a3)}
      e.appendChild(s);var x=document.createElement('button');x.type='button';x.className='evx';x.setAttribute('aria-label','Hapus agenda');x.textContent='\u00d7';x.dataset.j=j;e.appendChild(x);tl.appendChild(e)});
    emp.hidden=!!(hn||evs.length);
  }
  function go(n){view=new Date(view.getFullYear(),view.getMonth()+n,1);render()}
  function open(){cal.classList.add('open');cal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(){cal.classList.remove('open');cal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  grid.addEventListener('click',function(e){
    var b=e.target.closest('.day');if(!b)return;
    sel=new Date(+b.dataset.t);
    view=new Date(sel.getFullYear(),sel.getMonth(),1);
    render();
  });
  document.getElementById('calPrev').addEventListener('click',function(){go(-1)});
  document.getElementById('calNext').addEventListener('click',function(){go(1)});
  document.getElementById('calBack').addEventListener('click',close);
  document.getElementById('openCal').addEventListener('click',open);
  var addBtn=document.getElementById('addAg'),form=document.getElementById('agForm'),modal=document.getElementById('agModal'),inp=document.getElementById('agInp'),mdate=document.getElementById('agDate'),jm=document.getElementById('agJ'),je=document.getElementById('agS'),cat=document.getElementById('agC');
  function closeForm(){modal.hidden=true;inp.value='';jm.value='';je.value='';cat.value=''}
  addBtn.addEventListener('click',function(){mdate.textContent=selTxt.textContent;modal.hidden=false;inp.focus()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeForm()});
  var tp=document.getElementById('tp'),dial=document.getElementById('tpDial'),qH=document.getElementById('tpQH'),qM=document.getElementById('tpQM'),tgt=null,th=0,tm=0,mode='h',drag=false;
  var NS='http://www.w3.org/2000/svg';
  function pad(n){return (n<10?'0':'')+n}
  function mk(n,a,t){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(t!=null)e.textContent=t;return e}
  function pos(r,deg){var a=deg*Math.PI/180;return[120+r*Math.sin(a),120-r*Math.cos(a)]}
  function draw(){
    qH.textContent=pad(th);qM.textContent=pad(tm);
    qH.className='tpq'+(mode==='h'?' on':'');qM.className='tpq'+(mode==='m'?' on':'');
    while(dial.firstChild)dial.removeChild(dial.firstChild);
    dial.appendChild(mk('circle',{cx:120,cy:120,r:119,fill:'#fff',stroke:'#D4D4D4','stroke-width':1.5}));
    for(var i=0;i<60;i++){var big=i%5===0,ta=pos(big?104:108,i*6),tb=pos(112,i*6);dial.appendChild(mk('line',{x1:ta[0],y1:ta[1],x2:tb[0],y2:tb[1],stroke:big?'#111':'#C8C8C8','stroke-width':big?2:1,'stroke-linecap':'round'}))}
    dial.appendChild(mk('text',{x:120,y:148,'text-anchor':'middle','dominant-baseline':'central','font-size':10,'font-weight':800,'font-family':'Bricolage Grotesque,Plus Jakarta Sans,sans-serif',fill:'#111','letter-spacing':'-0.2'},'My Daily'));
    var cur=mode==='h'?th:tm,deg,r;
    if(mode==='h'){deg=(th%12)*30;r=(th>=1&&th<=12)?90:60}else{deg=tm*6;r=90}
    var p=pos(r,deg);
    dial.appendChild(mk('line',{x1:120,y1:120,x2:p[0],y2:p[1],stroke:'#111','stroke-width':2}));
    dial.appendChild(mk('circle',{cx:120,cy:120,r:5,fill:'#111'}));dial.appendChild(mk('circle',{cx:120,cy:120,r:2,fill:'#fff'}));
    dial.appendChild(mk('circle',{cx:p[0],cy:p[1],r:18,fill:'#111'}));
    function num(v,rr,k,size){
      if(v===cur)return;
      var q=pos(rr,k*30);
      dial.appendChild(mk('text',{x:q[0],y:q[1],'text-anchor':'middle','dominant-baseline':'central','font-size':size,'font-weight':500,'font-family':'Plus Jakarta Sans,sans-serif',fill:'#111'},mode==='h'&&rr===90?String(v):pad(v)));
    }
    for(var k=0;k<12;k++){
      if(mode==='h'){num(k===0?12:k,90,k,15);num(k===0?0:12+k,60,k,12)}
      else num(k*5,90,k,15);
    }
    dial.appendChild(mk('text',{x:p[0],y:p[1],'text-anchor':'middle','dominant-baseline':'central','font-size':mode==='h'&&r===60?12:15,'font-weight':700,'font-family':'Plus Jakarta Sans,sans-serif',fill:'#fff'},pad(cur)));
  }
  function pick(e){
    var b=dial.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*240-120,y=(e.clientY-b.top)/b.height*240-120;
    var ang=(Math.atan2(x,-y)*180/Math.PI+360)%360,d=Math.sqrt(x*x+y*y);
    if(mode==='h'){var k=Math.round(ang/30)%12;th=d<75?(k===0?0:12+k):(k===0?12:k)}
    else tm=Math.round(ang/6)%60;
    draw();
  }
  dial.addEventListener('pointerdown',function(e){drag=true;try{dial.setPointerCapture(e.pointerId)}catch(x){}pick(e)});
  dial.addEventListener('pointermove',function(e){if(drag)pick(e)});
  dial.addEventListener('pointerup',function(){if(!drag)return;drag=false;if(mode==='h'){mode='m';draw()}});
  dial.addEventListener('pointercancel',function(){drag=false});
  qH.addEventListener('click',function(){mode='h';draw()});
  qM.addEventListener('click',function(){mode='m';draw()});
  function openTp(input){
    tgt=input;document.getElementById('tpT').textContent=input===jm?'Jam mulai':'Jam selesai';
    var v=input.value.split(':');
    th=v[0]?+v[0]:new Date().getHours();tm=v[1]?+v[1]:0;
    mode='h';draw();tp.hidden=false;
  }
  jm.addEventListener('click',function(){openTp(jm)});
  je.addEventListener('click',function(){openTp(je)});
  document.getElementById('tpOk').addEventListener('click',function(){tgt.value=pad(th)+':'+pad(tm);tp.hidden=true});
  document.getElementById('tpClr').addEventListener('click',function(){tgt.value='';tp.hidden=true});
  tp.addEventListener('click',function(e){if(e.target===tp)tp.hidden=true});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')tp.hidden=true});
  document.getElementById('agNo').addEventListener('click',closeForm);
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var v=inp.value.trim();if(!v){inp.focus();return}
    var o={t:v};if(jm.value)o.j=jm.value;if(je.value)o.s=je.value;var c=cat.value.trim();if(c)o.c=c;
    var k=key(sel),l=(A[k]=A[k]||[]);l.push(o);
    l.sort(function(a,b){var x=(typeof a==='object'&&a.j)||'99:99',y=(typeof b==='object'&&b.j)||'99:99';return x<y?-1:x>y?1:0});
    saveA();closeForm();render();
  });
  tl.addEventListener('click',function(e){
    var x=e.target.closest('.evx');if(!x)return;
    var k=key(sel),l=A[k]||[];l.splice(+x.dataset.j,1);if(!l.length)delete A[k];saveA();render();
  });
  grid.addEventListener('click',closeForm);
  document.getElementById('calPrev').addEventListener('click',closeForm);
  document.getElementById('calNext').addEventListener('click',closeForm);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  render();
})();
;
(function(){
  var task=document.getElementById('task'),list=document.getElementById('tList'),emp=document.getElementById('tEmpty'),tabs=document.getElementById('tTabs'),modal=document.getElementById('tModal'),form=document.getElementById('tForm'),inp=document.getElementById('tInp'),note=document.getElementById('tNote'),pri=document.getElementById('tPri'),due=document.getElementById('tDue'),toastEl=document.getElementById('tToast'),tmsg=document.getElementById('tMsg'),tmt=document.getElementById('tMt'),qd=document.getElementById('tQd'),dl=document.getElementById('tDl'),dx=document.getElementById('tDx'),cu=document.getElementById('tCustom'),sv=document.getElementById('tSave');
  var T=[];try{T=JSON.parse(localStorage.getItem('tugas'))||[]}catch(e){T=[]}
  if(!Array.isArray(T))T=[];
  var f='all',p='sedang',ed=-1,bk=null,tt=0;
  function uid(){return (Math.random().toString(36)+'000000').slice(2,8)}
  var miss=false;T.forEach(function(x){if(!x.id){x.id=uid();miss=true}});if(miss){try{localStorage.setItem('tugas',JSON.stringify(T))}catch(e){}}
  var CHK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.500 4.500L19 7.500"/></svg>';
  var PL={tinggi:'Tinggi',sedang:'Sedang',rendah:'Rendah'},PC={tinggi:['#F1E8FF','#5B1FD0'],sedang:['#F1E8FF','#5B1FD0'],rendah:['#F1E8FF','#5B1FD0']};
  var MN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],DN=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  function save(){try{localStorage.setItem('tugas',JSON.stringify(T))}catch(e){}}
  function today0(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function parse(s){var a=s.split('-');return new Date(+a[0],+a[1]-1,+a[2])}
  function diff(s){return Math.round((parse(s)-today0())/864e5)}
  function dueLabel(s){var n=diff(s);if(n===0)return'Hari ini';if(n===1)return'Besok';if(n<0)return'Terlambat '+(-n)+' hari';var d=parse(s);return DN[d.getDay()]+', '+d.getDate()+' '+MN[d.getMonth()]}
  function markPri(){Array.prototype.forEach.call(pri.children,function(b){b.className=b.dataset.p===p?'on':''})}
  function pad(n){return n<10?'0'+n:''+n}
  function off(n){var d=today0();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function markDue(){
    var v=due.value,hit=false;
    Array.prototype.forEach.call(qd.querySelectorAll('button[data-d]'),function(b){var on=!!v&&v===off(+b.dataset.d);b.className=on?'on':'';if(on)hit=true});
    var cs=!!v&&!hit;cu.className='dp'+(cs?' on':'');dx.hidden=!cs;
    if(cs){var d=parse(v);dl.textContent=DN[d.getDay()]+', '+d.getDate()+' '+MN[d.getMonth()]}else dl.textContent='Pilih tanggal';
  }
  function chk(){sv.disabled=!inp.value.trim()}
  function toast(m){tmsg.textContent=m;toastEl.hidden=false;clearTimeout(tt);tt=setTimeout(function(){toastEl.hidden=true;bk=null},4000)}
  var sm='baru';try{sm=localStorage.getItem('urutT')||'baru'}catch(e){}
  var q='';
  document.getElementById('tSearch').addEventListener('input',function(){q=this.value.trim().toLowerCase();render()});
  var PR={tinggi:0,sedang:1,rendah:2};
  function cmpT(a,b){
    var x=T[a],y=T[b];
    if(sm==='lama')return b-a;
    if(sm==='tenggat'){var u=x.u||'9999',v=y.u||'9999';return u<v?-1:u>v?1:a-b}
    if(sm==='prioritas'){var d=(PR[x.p]!=null?PR[x.p]:1)-(PR[y.p]!=null?PR[y.p]:1);return d||a-b}
    if(sm==='az')return (x.t||'').toLowerCase().localeCompare((y.t||'').toLowerCase());
    return a-b;
  }
  document.getElementById('tSort').addEventListener('click',function(){sortMenu([['baru','Terbaru'],['lama','Terlama'],['tenggat','Tenggat terdekat'],['prioritas','Prioritas'],['az','Judul A\u2013Z']],sm,function(v){sm=v;try{localStorage.setItem('urutT',v)}catch(e){}render()})});
  function render(){
    Array.prototype.forEach.call(tabs.children,function(b){b.className=b.dataset.f===f?'on':''});
    list.innerHTML='';
    T.map(function(x,i){return i}).sort(function(a,b){return(!!T[b].pin-!!T[a].pin)||cmpT(a,b)}).forEach(function(i){
      var x=T[i];
      if(q&&(x.t||'').toLowerCase().indexOf(q)<0&&(x.n||'').toLowerCase().indexOf(q)<0)return;
      if(f==='todo'&&x.d)return;if(f==='done'&&!x.d)return;
      var r=document.createElement('div');r.className='tsk'+(x.d?' done':'');r.dataset.i=i;
      var c=document.createElement('button');c.type='button';c.className='tsk-c';c.dataset.i=i;c.setAttribute('aria-label',x.d?'Tandai belum selesai':'Tandai selesai');c.innerHTML=CHK;r.appendChild(c);
      var b=document.createElement('div');b.className='tsk-b';b.dataset.i=i;b.dataset.id=x.id||'';
      var t=document.createElement('div');t.className='tsk-t';t.textContent=x.t;b.appendChild(t);
      if(x.n){var n=document.createElement('div');n.className='tsk-n';n.textContent=x.n;b.appendChild(n)}
      var m=document.createElement('div');m.className='tsk-m';
      if(x.p&&PL[x.p]){var q=document.createElement('span');q.className='tsk-p';q.textContent=PL[x.p];q.style.background=PC[x.p][0];q.style.color=PC[x.p][1];m.appendChild(q)}
      if(x.u){var u=document.createElement('span');u.className='tsk-d'+(!x.d&&diff(x.u)<0?' late':'');u.textContent=dueLabel(x.u);m.appendChild(u)}
      if(m.children.length)b.appendChild(m);
      r.appendChild(b);
      if(x.pin)r.insertAdjacentHTML('beforeend',window.PIN);
      list.appendChild(r);
    });
    emp.hidden=list.children.length>0;
    document.getElementById('tEt').textContent=T.length?(q?'Tugas tidak ditemukan':'Tidak ada tugas di sini'):'Belum ada tugas';document.getElementById('tEs').textContent=T.length?(q?'Coba kata kunci lain.':'Coba pilih tab lain untuk melihat tugasmu.'):'Tekan tombol + di kanan bawah untuk menambah tugas pertamamu.';
  }
  function openT(){render();task.classList.add('open');task.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function closeT(){task.classList.remove('open');task.setAttribute('aria-hidden','true');document.body.style.overflow='';toastEl.hidden=true;var ts=document.getElementById('tSearch');if(ts&&ts.value){ts.value='';q='';render()}}
  function openForm(i){
    ed=i;var x=i>=0?T[i]:null;
    inp.value=x?x.t:'';note.value=x&&x.n?x.n:'';due.value=x&&x.u?x.u:'';p=x&&PL[x.p]?x.p:'sedang';
    markPri();markDue();chk();tmt.textContent=x?'Edit tugas':'Tugas baru';modal.dataset.eid=x&&x.id?x.id:'';modal.hidden=false;if(!x)inp.focus();
  }
  function closeForm(){modal.hidden=true;modal.dataset.eid='';ed=-1;inp.value='';note.value='';due.value='';p='sedang';markPri();markDue();chk()}
  document.getElementById('openTask').addEventListener('click',openT);
  document.getElementById('taskBack').addEventListener('click',closeT);
  document.getElementById('addTask').addEventListener('click',function(){openForm(-1)});
  document.getElementById('tNo').addEventListener('click',closeForm);
  tabs.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f=b.dataset.f;render()});
  pri.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;p=b.dataset.p;markPri()});
  inp.addEventListener('input',chk);
  due.addEventListener('change',markDue);due.addEventListener('input',markDue);
  dx.addEventListener('click',function(){due.value='';markDue()});
  qd.addEventListener('click',function(e){var b=e.target.closest('button[data-d]');if(!b)return;var v=off(+b.dataset.d);due.value=due.value===v?'':v;markDue()});
  list.addEventListener('click',function(e){
    var c=e.target.closest('.tsk-c'),x=e.target.closest('.evx'),b=e.target.closest('.tsk-b');
    if(c){var k=T[+c.dataset.i];k.d=!k.d;save();render()}
    else if(x){bk=T.slice();T.splice(+x.dataset.i,1);save();render();toast('Tugas dihapus')}
    else if(b){openForm(+b.dataset.i)}
  });
  document.getElementById('tUndo').addEventListener('click',function(){if(bk){T=bk;bk=null;save();render()}toastEl.hidden=true});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var v=inp.value.trim();if(!v){inp.focus();return}
    var o={t:v,n:note.value.trim(),p:p,d:ed>=0?!!T[ed].d:false};if(due.value)o.u=due.value;if(ed>=0&&T[ed].pin)o.pin=true;o.id=ed>=0&&T[ed].id?T[ed].id:uid();
    if(ed>=0)T[ed]=o;else T.unshift(o);
    save();closeForm();render();
  });
  lp(list,'.tsk',function(el){
    var i=+el.dataset.i,k=T[i];if(!k)return;
    sheet(k.t,[
      {l:'Edit',i:'edit',f:function(){openForm(i)}},
      {l:k.pin?'Lepas':'Pin',i:'pin',f:function(){k.pin=!k.pin;save();render()}},
      {l:k.d?'Belum':'Selesai',i:k.d?'undo':'done',f:function(){k.d=!k.d;save();render()}},
      {l:'Hapus',i:'del',d:1,f:function(){bk=T.slice();T.splice(i,1);save();render();toast('Tugas dihapus')}}
    ]);
  });
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!modal.hidden)closeForm();else if(task.classList.contains('open'))closeT()});
  render();
})();
;
(function(){
  var note=document.getElementById('note'),list=document.getElementById('nList'),emp=document.getElementById('nEmpty'),srch=document.getElementById('nSearch'),modal=document.getElementById('nModal'),form=document.getElementById('nForm'),inp=document.getElementById('nInp'),body=document.getElementById('nBody'),sv=document.getElementById('nSave'),mt=document.getElementById('nMt'),toastEl=document.getElementById('nToast'),msg=document.getElementById('nMsg');
  var N=[];try{N=JSON.parse(localStorage.getItem('catatan'))||[]}catch(e){N=[]}
  if(!Array.isArray(N))N=[];
  var q='',ed=-1,bk=null,tt=0;
  function uid(){return (Math.random().toString(36)+'000000').slice(2,8)}
  var miss=false;N.forEach(function(x){if(!x.id){x.id=uid();miss=true}});if(miss){try{localStorage.setItem('catatan',JSON.stringify(N))}catch(e){}}
  var MN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function save(){try{localStorage.setItem('catatan',JSON.stringify(N))}catch(e){}}
  window.addEventListener('md:notes',function(){try{var r=JSON.parse(localStorage.getItem('catatan'))||[];if(Array.isArray(r)){N=r;render()}}catch(e){}});
  function dl(ts){var d=new Date(ts),n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()),df=Math.round((a-b)/864e5);if(df===0)return'Hari ini';if(df===1)return'Kemarin';return d.getDate()+' '+MN[d.getMonth()]+(d.getFullYear()!==n.getFullYear()?' '+d.getFullYear():'')}
  function toast(m){msg.textContent=m;toastEl.hidden=false;clearTimeout(tt);tt=setTimeout(function(){toastEl.hidden=true;bk=null},4000)}
  function chk(){sv.disabled=!(inp.value.trim()||body.innerText.trim())}
  function fit(){}
  var OK={B:1,STRONG:1,I:1,EM:1,U:1,S:1,STRIKE:1,H2:1,BLOCKQUOTE:1,UL:1,OL:1,LI:1,DIV:1,P:1,BR:1,SPAN:1};
  function clean(n){
    Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3)return;
      if(c.nodeType!==1){n.removeChild(c);return}
      var t=c.tagName;
      if(t==='SCRIPT'||t==='STYLE'){n.removeChild(c);return}
      clean(c);
      if(!OK[t]){while(c.firstChild)n.insertBefore(c.firstChild,c);n.removeChild(c);return}
      var st=t==='SPAN'?c.getAttribute('style'):null;
      while(c.attributes.length)c.removeAttribute(c.attributes[0].name);
      if(st){var m=st.match(/background-color:\s*(#[0-9a-f]{3,8}|rgba?\([\d\s,.]+\))/i);if(m)c.setAttribute('style','background-color:'+m[1])}
    });
  }
  function sane(h){var d=new DOMParser().parseFromString('<body>'+h,'text/html').body;clean(d);return d.innerHTML}
  function setBody(x){
    body.innerHTML='';if(!x)return;
    if(x.h){body.innerHTML=sane(x.h)}
    else if(x.b){x.b.split('\n').forEach(function(l){var d=document.createElement('div');if(l)d.textContent=l;else d.appendChild(document.createElement('br'));body.appendChild(d)})}
  }
  body.addEventListener('paste',function(e){e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t)});
  var tb=document.getElementById('etb');
  function selIn(tag){var s=getSelection(),n=s&&s.anchorNode;if(n&&n.nodeType===3)n=n.parentNode;return n&&body.contains(n)?n.closest(tag):null}
  function hlOn(){var v='';try{v=document.queryCommandValue('hiliteColor')||document.queryCommandValue('backColor')||''}catch(e){}return /255,\s*229,\s*143/.test(v)}
  function ex(c,v){body.focus();try{document.execCommand(c,false,v==null?null:v)}catch(e){}}
  function upd(){
    if(modal.hidden)return;
    var s=getSelection();if(!s||!s.anchorNode||!body.contains(s.anchorNode))return;
    var st={b:'bold',i:'italic',u:'underline',s:'strikeThrough',ul:'insertUnorderedList',ol:'insertOrderedList'};
    Array.prototype.forEach.call(tb.querySelectorAll('button'),function(b){
      var k=b.dataset.k,on=false;
      try{if(st[k])on=document.queryCommandState(st[k]);else if(k==='h')on=!!selIn('h2');else if(k==='q')on=!!selIn('blockquote');else if(k==='hl')on=hlOn()}catch(e){}
      b.classList.toggle('on',!!on);
    });
  }
  document.addEventListener('selectionchange',upd);
  tb.addEventListener('mousedown',function(e){if(e.target.closest('button'))e.preventDefault()});
  tb.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;var k=b.dataset.k;
    if(k==='b')ex('bold');else if(k==='i')ex('italic');else if(k==='u')ex('underline');else if(k==='s')ex('strikeThrough');
    else if(k==='ul')ex('insertUnorderedList');else if(k==='ol')ex('insertOrderedList');
    else if(k==='un')ex('undo');else if(k==='re')ex('redo');
    else if(k==='cl'){ex('removeFormat');if(selIn('h2')||selIn('blockquote'))ex('formatBlock','<div>')}
    else if(k==='h')ex('formatBlock',selIn('h2')?'<div>':'<h2>');
    else if(k==='q')ex('formatBlock',selIn('blockquote')?'<div>':'<blockquote>');
    else if(k==='hl'){var on=hlOn();document.execCommand('styleWithCSS',false,true);ex('hiliteColor',on?'transparent':'#FFE58F');document.execCommand('styleWithCSS',false,false)}
    chk();upd();
  });
  if(window.visualViewport){var vv=window.visualViewport;var pos=function(){tb.style.bottom=Math.max(0,window.innerHeight-vv.height-vv.offsetTop)+'px'};vv.addEventListener('resize',pos);vv.addEventListener('scroll',pos);pos()}
  var sm='baru';try{sm=localStorage.getItem('urutN')||'baru'}catch(e){}
  function ttl(x){return (x.t||(x.b||'').split('\n')[0]||'').toLowerCase()}
  function cmp(a,b){if(sm==='lama')return(a.m||0)-(b.m||0);if(sm==='az')return ttl(a).localeCompare(ttl(b));if(sm==='za')return ttl(b).localeCompare(ttl(a));return(b.m||0)-(a.m||0)}
  document.getElementById('nSort').addEventListener('click',function(){sortMenu([['baru','Terbaru'],['lama','Terlama'],['az','Judul A\u2013Z'],['za','Judul Z\u2013A']],sm,function(v){sm=v;try{localStorage.setItem('urutN',v)}catch(e){}render()})});
  function render(){
    var kw=q.trim().toLowerCase();
    var items=N.map(function(x,i){return{x:x,i:i}}).filter(function(o){return!kw||(o.x.t||'').toLowerCase().indexOf(kw)>-1||(o.x.b||'').toLowerCase().indexOf(kw)>-1}).sort(function(a,b){return(!!b.x.pin-!!a.x.pin)||cmp(a.x,b.x)});
    list.innerHTML='';
    items.forEach(function(o){
      var x=o.x,r=document.createElement('button');r.type='button';r.className='nt'+(x.pin?' pn':'');r.dataset.i=o.i;r.dataset.id=x.id||'';
      var lines=(x.b||'').split('\n'),t=x.t||lines[0].trim().slice(0,70)||'Tanpa judul',rest=x.t?(x.b||''):lines.slice(1).join(' ');
      var h=document.createElement('div');h.className='nt-t';h.textContent=t;r.appendChild(h);
      if(x.pin)r.insertAdjacentHTML('beforeend',window.PIN);
      if(x.m){var d=document.createElement('div');d.className='nt-d';var dt=new Date(x.m);d.textContent=('0'+dt.getHours()).slice(-2)+':'+('0'+dt.getMinutes()).slice(-2);r.appendChild(d)}
      list.appendChild(r);
    });
    emp.hidden=items.length>0;
    document.getElementById('nEt').textContent=N.length?'Catatan tidak ditemukan':'Belum ada catatan';
    document.getElementById('nEs').textContent=N.length?'Coba kata kunci lain.':'Tekan tombol + di kanan bawah untuk menulis catatan pertamamu.';
  }
  function navHome(){var nb=document.querySelectorAll('.nb');nb.forEach(function(x){x.classList.remove('on')});if(nb[0])nb[0].classList.add('on')}
  function openN(){render();note.classList.add('open');note.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function closeN(){note.classList.remove('open');note.setAttribute('aria-hidden','true');document.body.style.overflow='';toastEl.hidden=true;srch.value='';q='';navHome()}
  function openForm(i){
    ed=i;var x=i>=0?N[i]:null;
    inp.value=x&&x.t?x.t:'';setBody(x);
    mt.textContent=x?'Edit catatan':'Catatan baru';modal.dataset.eid=x&&x.id?x.id:'';
    modal.hidden=false;fit();chk();if(!x)inp.focus();
  }
  function closeForm(){modal.hidden=true;modal.dataset.eid='';ed=-1;inp.value='';body.innerHTML=''}
  document.getElementById('openNote2').addEventListener('click',openN);
  document.getElementById('noteBack').addEventListener('click',closeN);
  document.getElementById('addNote').addEventListener('click',function(){openForm(-1)});
  document.getElementById('nNo').addEventListener('click',closeForm);
  srch.addEventListener('input',function(){q=srch.value;render()});
  inp.addEventListener('input',chk);
  body.addEventListener('input',function(){var h=body.innerHTML;if(h==='<br>'||h==='<div><br></div>')body.innerHTML='';chk()});
  list.addEventListener('click',function(e){var b=e.target.closest('.nt');if(b)openForm(+b.dataset.i)});
  lp(list,'.nt',function(el){
    var i=+el.dataset.i,k=N[i];if(!k)return;
    sheet(k.t||'Catatan',[
      {l:'Edit',i:'edit',f:function(){openForm(i)}},
      {l:k.pin?'Lepas':'Pin',i:'pin',f:function(){k.pin=!k.pin;save();render()}},
      {l:'Hapus',i:'del',d:1,f:function(){bk=N.slice();N.splice(i,1);save();render();toast('Catatan dihapus')}}
    ]);
  });
  document.getElementById('nUndo').addEventListener('click',function(){if(bk){N=bk;bk=null;save();render()}toastEl.hidden=true});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var t=inp.value.trim(),b=body.innerText.trim();if(!t&&!b){inp.focus();return}
    var h=sane(body.innerHTML),o={t:t,b:b,h:h,m:Date.now()};if(ed>=0&&N[ed].pin)o.pin=true;o.id=ed>=0&&N[ed].id?N[ed].id:uid();
    if(ed>=0){var old=N[ed];if(old.t===t&&old.b===b&&(old.h||'')===h)o.m=old.m||o.m;N[ed]=o}else N.unshift(o);
    save();closeForm();render();
  });
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!modal.hidden)closeForm();else if(note.classList.contains('open'))closeN()});
  render();
})();
;
(function(){
  var feed=document.getElementById('feed'),list=document.getElementById('fList'),emp=document.getElementById('fEmpty'),toastEl=document.getElementById('fToast'),msg=document.getElementById('fMsg');
  var F=[];try{F=JSON.parse(localStorage.getItem('feed'))||[]}catch(e){F=[]}
  if(!Array.isArray(F))F=[];
  var bk=null,tt=0,openCm={},draft={},refocus='',ftab='semua',fq='';
  var MN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function uid(){return (Math.random().toString(36)+'000000').slice(2,8)}
  function pad(n){return n<10?'0'+n:''+n}
  function save(){try{localStorage.setItem('feed',JSON.stringify(F));return true}catch(e){return false}}
  var miss=false;F.forEach(function(x){if(!x.id){x.id=uid();miss=true}});if(miss)save();
  function when(ts){
    var d=new Date(ts),n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()),df=Math.round((a-b)/864e5),hm=pad(d.getHours())+':'+pad(d.getMinutes());
    if(df===0)return'Hari ini · '+hm;if(df===1)return'Kemarin · '+hm;
    return d.getDate()+' '+MN[d.getMonth()]+(d.getFullYear()!==n.getFullYear()?' '+d.getFullYear():'')+' · '+hm;
  }
  var HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8.5-5.2-8.5-11.2A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 3.2C20.5 15.8 12 21 12 21z"/></svg>';
  var CMT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 1-4.3 16.9L3 21l1.3-4.6A9 9 0 0 1 12 3z"/><path d="M8.5 10.5h7M8.5 14h7"/></svg>';
  var SHR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5L14 5v3.6C8.4 9.1 4.8 12.6 4 19c2.7-3.4 5.8-4.9 10-4.9V18z"/></svg>';
  var SEND='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var BKM='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  var DEL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function ab(a,i,on,lab,svg,extra){var bt=document.createElement('button');bt.type='button';bt.className='fa'+(on?' on':'')+(a==='save'?' sv':'');bt.dataset.a=a;bt.dataset.i=i;bt.setAttribute('aria-label',lab);bt.innerHTML=svg+(extra||'');return bt}
  function render(){
    Array.prototype.forEach.call(list.querySelectorAll('.fci-in'),function(el){var p=el.closest('.fp');if(p)draft[p.dataset.id]=el.value});
    var af=document.activeElement;if(af&&af.classList&&af.classList.contains('fci-in')){var ap=af.closest('.fp');if(ap)refocus=ap.dataset.id}
    list.innerHTML='';
    var sc=function(x){return (x.l?1:0)+(x.c||[]).length+(x.sh||0)};
    var ord=F.map(function(x,i){return i}).filter(function(i){return ftab!=='simpan'||F[i].s}).filter(function(i){return !fq||String(F[i].t||'').toLowerCase().indexOf(fq)>-1}).sort(function(a,b){
      var x=F[a],y=F[b],nw=(y.m||0)-(x.m||0);
      if(ftab==='baru')return nw;
      if(ftab==='populer')return (sc(y)-sc(x))||nw;
      return(!!y.pin-!!x.pin)||nw;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#fTabs button'),function(b){var on=b.dataset.t===ftab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false')});
    ord.forEach(function(i){
      var x=F[i],r=document.createElement('div');r.className='fp';r.dataset.i=i;r.dataset.id=x.id||'';
      var b=document.createElement('div');b.className='fb';
      var h=document.createElement('div');h.className='fh';
      var av=document.createElement('span');av.className='fav';PROFIL.av(av);h.appendChild(av);
      var wh=document.createElement('div');wh.className='fw';
      var n=document.createElement('div');n.className='fn';n.textContent=PROFIL.nama;if(x.pin)n.insertAdjacentHTML('beforeend',window.PIN);wh.appendChild(n);
      var m=document.createElement('div');m.className='fm';m.textContent='@'+PROFIL.handle+' · '+(x.e?x.e+' ':'')+when(x.m);wh.appendChild(m);h.appendChild(wh);
      var mo=document.createElement('button');mo.type='button';mo.className='fmore';mo.dataset.a='more';mo.dataset.i=i;mo.setAttribute('data-nolp','');mo.setAttribute('aria-label','Opsi posting');
      mo.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';h.appendChild(mo);b.appendChild(h);
      if(x.t){var t=document.createElement('div');t.className='ft';
        String(x.t).split(/(#[\p{L}\p{N}_]+)/u).forEach(function(part,j){if(!part)return;if(j%2){var hs=document.createElement('span');hs.className='ht';hs.textContent=part;t.appendChild(hs)}else t.appendChild(document.createTextNode(part))});
        b.appendChild(t)}
      if(x.img){
        var w=document.createElement('div');w.className='fpw';
        var im=document.createElement('img');im.className='fpi';im.alt='Gambar posting';im.decoding='async';im.loading='lazy';
        var setR=function(r){if(r>0)w.style.aspectRatio=String(Math.min(1.91,Math.max(.8,r)))};
        if(x.iw&&x.ih)setR(x.iw/x.ih);else im.onload=function(){setR(im.naturalWidth/im.naturalHeight)};
        im.src=x.img;w.appendChild(im);b.appendChild(w)}
      var f=document.createElement('div');f.className='ff';var nc=(x.c||[]).length;
      f.appendChild(ab('like',i,x.l,x.l?'Batal suka':'Suka',HEART,'<span>'+(x.l?1:0)+'</span>'));
      f.appendChild(ab('cm',i,!!openCm[x.id],'Komentar',CMT,'<span>'+nc+'</span>'));
      f.appendChild(ab('share',i,false,'Bagikan',SHR,'<span>'+(x.sh||0)+'</span>'));
      f.appendChild(ab('save',i,x.s,x.s?'Batal simpan':'Simpan',BKM));
      b.appendChild(f);
      if(openCm[x.id]){
        var cm=document.createElement('div');cm.className='fcm';cm.setAttribute('data-nolp','');
        (x.c||[]).forEach(function(c,j){
          var ci=document.createElement('div');ci.className='fci';
          var ca=document.createElement('span');ca.className='fav';PROFIL.av(ca);ci.appendChild(ca);
          var cb=document.createElement('div');cb.className='fcb';
          var cn=document.createElement('span');cn.className='fcn';cn.textContent=PROFIL.nama;cb.appendChild(cn);
          var ct=document.createElement('span');ct.className='fct';ct.textContent=when(c.m);cb.appendChild(ct);
          var cx=document.createElement('div');cx.className='fcx';cx.textContent=c.t;cb.appendChild(cx);
          ci.appendChild(cb);
          var cd=document.createElement('button');cd.type='button';cd.className='fcd';cd.dataset.a='cdel';cd.dataset.i=i;cd.dataset.j=j;cd.setAttribute('aria-label','Hapus komentar');cd.innerHTML=DEL;ci.appendChild(cd);
          cm.appendChild(ci)});
        var fo=document.createElement('form');fo.className='fcf';fo.dataset.i=i;
        fo.innerHTML='<input class="fci-in" type="text" placeholder="Tulis komentar" autocomplete="off" aria-label="Tulis komentar"><button class="fcs" type="submit" aria-label="Kirim komentar" disabled>'+SEND+'</button>';
        if(draft[x.id]){fo.firstChild.value=draft[x.id];fo.lastChild.disabled=false}
        cm.appendChild(fo);b.appendChild(cm)}
      r.appendChild(b);
      list.appendChild(r);
    });
    emp.hidden=list.children.length>0;
    document.getElementById('fEt').textContent=ftab==='simpan'&&!fq?'Belum ada posting tersimpan':fq?'Posting tidak ditemukan':'Belum ada posting';
    document.getElementById('fEs').textContent=ftab==='simpan'&&!fq?'Tekan ikon bookmark pada posting untuk menyimpannya.':fq?'Coba kata kunci lain.':'Postingan kamu akan muncul di sini.';
    if(refocus){var rf=list.querySelector('.fp[data-id="'+refocus+'"] .fci-in');refocus='';if(rf)rf.focus()}
  }
  function toast(m,nu){msg.textContent=m;document.getElementById('fUndo').hidden=!!nu;toastEl.hidden=false;clearTimeout(tt);tt=setTimeout(function(){toastEl.hidden=true;bk=null},4000)}
  function navHome(){var nb=document.querySelectorAll('.nb');nb.forEach(function(x){x.classList.remove('on')});if(nb[0])nb[0].classList.add('on')}
  function openF(){setH(false);lastY=0;render();feed.classList.add('open');feed.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';document.body.classList.add('feed-open')}
  function closeF(s){setH(false);if(!fm.hidden)closeC();feed.classList.remove('open');feed.setAttribute('aria-hidden','true');document.body.style.overflow='';document.body.classList.remove('feed-open');toastEl.hidden=true;if(s!==true)navHome()}
  document.getElementById('openFeed').addEventListener('click',openF);
  var fsr=document.getElementById('fSr'),fsi=document.getElementById('fSearch'),fsb=document.getElementById('fSearchBtn');
  fsb.addEventListener('click',function(){
    var o=fsr.hidden;fsr.hidden=!o;fsb.setAttribute('aria-expanded',o?'true':'false');
    if(o)fsi.focus();else{fsi.value='';fq='';render()}
  });
  fsi.addEventListener('input',function(){fq=fsi.value.trim().toLowerCase();render()});
  var lastY=0,hid=false;
  function setH(v){hid=v;document.body.classList.toggle('fhide',v)}
  feed.addEventListener('scroll',function(){
    var y=Math.max(0,feed.scrollTop),d=y-lastY;
    if(Math.abs(d)<8)return;
    if(y<60||d<0)setH(false);else setH(true);
    lastY=y;
  },{passive:true});
  document.getElementById('fTabs').addEventListener('click',function(e){
    var b=e.target.closest('button[data-t]');if(!b)return;
    ftab=b.dataset.t;render();var sc=document.getElementById('feed');if(sc)sc.scrollTop=0;
  });
  document.getElementById('feedBack').addEventListener('click',closeF);
  document.querySelectorAll('.nb')[0].addEventListener('click',function(){if(feed.classList.contains('open'))closeF(true)});
  /* Clara menumpuk di atas Feed: cukup tutup form posting, Feed tetap terbuka
     supaya tombol kembali dari chat balik ke Feed. */
  document.getElementById('openChat').addEventListener('click',function(){if(!fm.hidden)closeC()});
  var fm=document.getElementById('fModal'),fin=document.getElementById('fInp'),fsv=document.getElementById('fSave'),ferr=document.getElementById('fErr'),ffm=document.getElementById('fForm'),fem=document.getElementById('fEm'),fbe=document.getElementById('fBtnEm'),fimg=document.getElementById('fImg'),fie=document.getElementById('fImgEl'),pic='',picW=0,picH=0;
  var EM='😀😂🥰😍😎🤔😴😢😤🙏👍👏🔥✨❤️🎉☕🍜🌧️☀️🌙📚💪🏃🎵🌸🐱🐶🍰🎮✈️🏠'.match(/(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*)/gu)||[];
  EM.forEach(function(e){var b=document.createElement('button');b.type='button';b.textContent=e;b.setAttribute('aria-label','Emoji '+e);fem.appendChild(b)});
  function chk(){fsv.disabled=!(fin.value.trim()||pic);ferr.textContent=''}
  function showPic(){fimg.hidden=!pic;if(pic)fie.src=pic;else fie.removeAttribute('src')}
  function emo(o){fem.hidden=!o;fbe.classList.toggle('on',o);fbe.setAttribute('aria-expanded',o?'true':'false')}
  function openC(){fin.value='';pic='';showPic();emo(false);chk();fm.hidden=false;document.body.classList.add('fc-open');setTimeout(function(){fin.focus()},60)}
  function closeC(){fm.hidden=true;document.body.classList.remove('fc-open');fin.value='';pic='';showPic();emo(false);chk()}
  function ins(t){var a=fin.selectionStart,e=fin.selectionEnd;if(typeof a!=='number'){a=e=fin.value.length}fin.value=fin.value.slice(0,a)+t+fin.value.slice(e);var c=a+t.length;fin.focus();try{fin.setSelectionRange(c,c)}catch(x){}chk()}
  function loadPic(file){
    if(!file||!/^image\//.test(file.type))return;
    var r=new FileReader();
    r.onload=function(){var im=new Image();im.onload=function(){
      var k=Math.min(1,960/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      pic=c.toDataURL('image/jpeg',.75);picW=c.width;picH=c.height;showPic();chk();
    };im.onerror=function(){ferr.textContent='Gambar tidak bisa dibuka.'};im.src=r.result};
    r.readAsDataURL(file);
  }
  document.querySelector('.nav .plus').addEventListener('click',function(){if(!feed.classList.contains('open'))openF();openC()});
  document.getElementById('fNo').addEventListener('click',closeC);
  document.addEventListener('profil',function(){render()});
  fin.addEventListener('input',chk);
  document.getElementById('fBtnImg').addEventListener('click',function(){document.getElementById('fFile').click()});
  document.getElementById('fBtnCam').addEventListener('click',function(){document.getElementById('fCam').click()});
  ['fFile','fCam'].forEach(function(id){var el=document.getElementById(id);el.addEventListener('change',function(){loadPic(el.files&&el.files[0]);el.value=''})});
  document.getElementById('fImgX').addEventListener('click',function(){pic='';showPic();chk()});
  fbe.addEventListener('click',function(){emo(fem.hidden)});
  fem.addEventListener('click',function(e){var b=e.target.closest('button');if(b)ins(b.textContent)});
  document.getElementById('fBtnTag').addEventListener('click',function(){var v=fin.value,a=fin.selectionStart;ins(a>0&&!/\s/.test(v.charAt(a-1))?' #':'#')});
  if(window.visualViewport){var vv=window.visualViewport,kb=function(){fm.style.setProperty('--kb',Math.max(0,window.innerHeight-vv.height-vv.offsetTop)+'px')};vv.addEventListener('resize',kb);vv.addEventListener('scroll',kb)}
  ffm.addEventListener('submit',function(e){
    e.preventDefault();
    var v=fin.value.trim();if(!v&&!pic){fin.focus();return}
    var o={id:uid(),t:v,m:Date.now()};if(pic){o.img=pic;o.iw=picW;o.ih=picH}
    F.unshift(o);
    if(!save()){F.shift();ferr.textContent='Penyimpanan penuh. Coba gambar yang lebih kecil atau hapus posting lama.';return}
    closeC();render();
  });
  function shareP(k){
    var txt=(k.t||'').slice(0,500)||'Posting dari My Daily';
    if(navigator.share){navigator.share({text:txt}).catch(function(){})}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){toast('Teks disalin',1)},function(){toast('Tidak bisa menyalin',1)})}
    else toast('Berbagi tidak didukung di perangkat ini',1);
  }
  list.addEventListener('click',function(e){
    var a=e.target.closest('[data-a]');if(!a)return;
    var k=F[+a.dataset.i];if(!k)return;
    var t=a.dataset.a;
    if(t==='like'){k.l=!k.l;save();render()}
    else if(t==='save'){k.s=!k.s;save();render()}
    else if(t==='cm'){if(openCm[k.id])delete openCm[k.id];else{openCm[k.id]=1;refocus=k.id}render()}
    else if(t==='share'){k.sh=(k.sh||0)+1;save();render();shareP(k)}
    else if(t==='more')postMenu(+a.dataset.i,a);
    else if(t==='cdel'){(k.c||[]).splice(+a.dataset.j,1);save();render()}
  });
  list.addEventListener('input',function(e){var el=e.target;if(el.classList&&el.classList.contains('fci-in')){var bt=el.parentNode.querySelector('.fcs');if(bt)bt.disabled=!el.value.trim()}});
  list.addEventListener('submit',function(e){
    e.preventDefault();
    var fo=e.target.closest('.fcf');if(!fo)return;
    var k=F[+fo.dataset.i],v=fo.querySelector('.fci-in').value.trim();
    if(!k||!v)return;
    (k.c=k.c||[]).push({id:uid(),t:v,m:Date.now()});
    if(!save()){k.c.pop();toast('Penyimpanan penuh',1);return}
    delete draft[k.id];refocus=k.id;render();
  });
  function postMenu(i,anchor){
    var k=F[i];if(!k)return;
    popMenu(anchor,[
      {l:k.pin?'Lepas pin':'Pin postingan',f:function(){k.pin=!k.pin;save();render()}},
      {l:'Hapus',d:1,f:function(){bk=F.slice();F.splice(i,1);save();render();toast('Posting dihapus')}}
    ]);
  }
  document.getElementById('fUndo').addEventListener('click',function(){if(bk){F=bk;bk=null;save();render()}toastEl.hidden=true});
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if(!fm.hidden)closeC();else if(feed.classList.contains('open'))closeF()});
  render();
})();
;
(function(){
  var $=function(i){return document.getElementById(i)};
  var prof=$('prof'),pm=$('pModal'),P=window.PROFIL,tt=0,nbs=document.querySelectorAll('.nav .nb');
  function navHome(){nbs.forEach(function(x){x.classList.remove('on')});if(nbs[0])nbs[0].classList.add('on')}
  function list(k){try{var a=JSON.parse(localStorage.getItem(k));return Array.isArray(a)?a:[]}catch(e){return[]}}
  function toast(m){$('pMsg').textContent=m;$('pToast').hidden=false;clearTimeout(tt);tt=setTimeout(function(){$('pToast').hidden=true},2800)}
  function render(){
    P.av($('pfAv'));$('pfName').textContent=P.nama;$('pfHandle').textContent='@'+P.handle;
    var b=$('pfBio');b.textContent=P.bio||'Belum ada bio. Ketuk Edit profil untuk menambahkan.';b.classList.toggle('emp',!P.bio);
    var T=list('tugas');
    $('stT').textContent=T.filter(function(x){return x&&x.d}).length+'/'+T.length;
    $('stN').textContent=list('catatan').length;$('stF').textContent=list('feed').length;
  }
  function openP(){render();prof.classList.add('open');prof.setAttribute('aria-hidden','false');prof.scrollTop=0;document.body.style.overflow='hidden';document.body.classList.add('prof-open')}
  function closeP(s,keep){
    if(!pm.hidden)closeM();
    prof.classList.remove('open');prof.setAttribute('aria-hidden','true');document.body.classList.remove('prof-open');$('pToast').hidden=true;
    if(!keep)document.body.style.overflow='';
    if(!s)navHome();
  }
  function isOpen(){return prof.classList.contains('open')}
  function cleanUser(v){return v.toLowerCase().replace(/[^a-z0-9._]/g,'').slice(0,20)}
  var pend;
  function curF(){return pend===undefined?P.foto:pend}
  function chk(){$('pSave').disabled=!$('pNama').value.trim();$('pCnt').textContent=$('pBio').value.length+'/80';P.av($('pPre'),curF(),($('pNama').value.trim().charAt(0)||'V').toUpperCase());$('pFotoDel').hidden=!curF()}
  function loadFoto(file){
    if(!file||!/^image\//.test(file.type))return;
    var r=new FileReader();
    r.onload=function(){var im=new Image();im.onload=function(){
      var m=Math.min(im.width,im.height),d=Math.min(320,m),c=document.createElement('canvas');
      c.width=c.height=d;c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,d,d);
      pend=c.toDataURL('image/jpeg',.85);chk();
    };im.onerror=function(){toast('Gambar tidak bisa dibuka')};im.src=r.result};
    r.readAsDataURL(file);
  }
  function openM(){
    pend=undefined;$('pFile').value='';$('pNama').value=P.nama;$('pUser').value=P.handle;$('pBio').value=P.bio;chk();
    pm.hidden=false;document.body.classList.add('pm-open');pm.scrollTop=0;
  }
  function closeM(){
    pm.hidden=true;document.body.classList.remove('pm-open');
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  }
  $('openProf').addEventListener('click',function(){if(!isOpen())openP()});
  $('profBack').addEventListener('click',function(){closeP()});
  $('barAv').addEventListener('click',function(){$('openProf').click()});
  document.querySelectorAll('.nav .nb,.nav .plus').forEach(function(b){
    /* Clara adalah lapisan di atas Profil: membukanya tidak menutup Profil,
       supaya tombol kembali dari chat balik ke Profil. */
    if(b.id==='openProf'||b.id==='openChat')return;
    b.addEventListener('click',function(){if(isOpen())closeP(true,b!==nbs[0])});
  });
  $('pfEdit').addEventListener('click',openM);
  $('pfRowEdit').addEventListener('click',openM);
  $('pNo').addEventListener('click',closeM);
  $('pFotoBtn').addEventListener('click',function(){$('pFile').click()});
  $('pFotoDel').addEventListener('click',function(){pend='';chk()});
  $('pPre').addEventListener('click',function(){$('pFile').click()});
  $('pPre').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('pFile').click()}});
  $('pFile').addEventListener('change',function(){loadFoto(this.files&&this.files[0]);this.value=''});
  ['pNama','pBio'].forEach(function(id){$(id).addEventListener('input',chk)});
  $('pUser').addEventListener('input',function(){var v=cleanUser(this.value);if(v!==this.value)this.value=v});
  $('pForm').addEventListener('submit',function(e){
    e.preventDefault();
    var n=$('pNama').value.trim().slice(0,20);if(!n)return;
    var u=cleanUser($('pUser').value)||cleanUser(n)||'user';
    var old={n:P.nama,u:P.handle,b:P.bio,f:P.foto};
    P.nama=n;P.handle=u;P.bio=$('pBio').value.trim().slice(0,80);if(pend!==undefined)P.foto=pend;
    if(!P.save()){P.nama=old.n;P.handle=old.u;P.bio=old.b;P.foto=old.f;toast('Penyimpanan penuh, profil tidak tersimpan');return}
    window.applyProfil();render();closeM();toast('Profil diperbarui');
  });
  $('pfReset').addEventListener('click',function(){
    window.sheet('',[{l:'Hapus semua',i:'del',d:1,f:function(){
      ['agenda','catatan','keuangan','jam_alarm','feed','tugas','profil','chat','urutN','urutT','qi','bn'].forEach(function(k){try{localStorage.removeItem(k)}catch(e){}});
      location.reload();
    }}]);
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pm.hidden){closeM();e.stopImmediatePropagation()}},true);
})();
;
/* Chat AI. Permintaan diteruskan ke server proxy milik aplikasi ini (/api/chat).
   Kunci API disimpan di sisi server, tidak pernah ada di file ini. */
(function(){
  var CHAT_API='/api/chat';
  var MODEL='mydaily';
  var SYS='Kamu adalah Clara, teman ngobrol yang ramah. Ngobrol santai seperti teman, tanpa menyebut nama aplikasi apa pun dan tanpa format markdown.';
  var $=function(i){return document.getElementById(i)};
  var chat=$('chat'),list=$('chatList'),inp=$('chatInp'),send=$('chatSend'),form=$('chatForm');
  var M=[],busy=false;
  try{var a=JSON.parse(localStorage.getItem('chat'));if(Array.isArray(a))M=a.filter(function(x){return x&&(x.r==='u'||x.r==='a')&&typeof x.t==='string'}).slice(-60)}catch(e){M=[]}
  function save(){try{localStorage.setItem('chat',JSON.stringify(M.slice(-60)))}catch(e){}}
  function end(){chat.scrollTop=chat.scrollHeight}
  chat.addEventListener('scroll',function(){chat.classList.toggle('scrolled',chat.scrollTop>4)},{passive:true});
  function bub(c,t){var d=document.createElement('div');d.className='cm '+c;d.textContent=t;list.appendChild(d);return d}
  function pad(n){return n<10?'0'+n:''+n}
  function hm(ts){var d=new Date(ts);return isNaN(d)?'':pad(d.getHours())+'.'+pad(d.getMinutes())}
  function jamLabel(ts){
    var d=new Date(ts);if(!ts||isNaN(d))return '';
    var a=new Date();a.setHours(0,0,0,0);
    var sel=Math.round((a-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
    if(sel===0)return 'Hari ini '+hm(ts);
    if(sel===1)return 'Kemarin '+hm(ts);
    return d.getDate()+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()]+' '+hm(ts);
  }
  function render(anim){
    list.innerHTML='';
    if(!M.length){list.insertAdjacentHTML('beforeend','<div class="cem"><b>Halo!</b>Tanya apa saja atau minta bantuan menyusun tugas dan harianmu.</div>');return}
    var kw=(typeof skw==='string'?skw:'').trim().toLowerCase();
    var rows=[];
    M.forEach(function(m,i){if(!kw||(m.t||'').toLowerCase().indexOf(kw)>-1)rows.push({m:m,i:i})});
    if(!rows.length){list.insertAdjacentHTML('beforeend','<div class="cem"><b>Tidak ditemukan</b>Coba kata kunci lain.</div>');return}
    rows.forEach(function(o){
      var m=o.m,i=o.i;
      var d=document.createElement('div');
      d.className='cm '+m.r+(kw?' hit':(i>0&&M[i-1].r===m.r?' sg':''))+(kw?'':(!M[i+1]||M[i+1].r!==m.r?' ak':''))+(m.x?' rxd':'');
      d.dataset.i=i;
      var s=document.createElement('span');s.textContent=m.t;d.appendChild(s);
      if(m.d){var t=document.createElement('span');t.className='t';t.textContent=hm(m.d);d.appendChild(t)}
      if(m.x){var g=document.createElement('span');g.className='brx';var bt=document.createElement('button');bt.type='button';bt.setAttribute('aria-label','Hapus reaksi');bt.textContent=m.x;g.appendChild(bt);d.appendChild(g)}
      if(anim&&i===M.length-1)d.classList.add('baru');
      list.appendChild(d);
    });
  }
  function dots(){var d=document.createElement('div');d.className='cm a dots';d.innerHTML='<i></i><i></i><i></i>';list.appendChild(d);return d}
  function fit(){inp.style.height='auto';inp.style.height=Math.min(120,inp.scrollHeight)+'px'}
  function upd(){send.disabled=busy||!inp.value.trim()}
  /* [10 Nov] Clara sekarang sadar konteks: membawa ringkasan belajar (Brain)
     dan boleh memanggil tool fitur (AITools) maksimal 3 putaran per pesan. */
  function ask(){
    if(!CHAT_API)return Promise.reject(new Error('Chat AI belum siap. Coba lagi sebentar.'));
    var msgs=M.slice(-20).map(function(m){return{role:m.r==='u'?'user':'assistant',content:m.t}});
    while(msgs.length&&msgs[0].role!=='user')msgs.shift();
    var mem='';try{mem=(window.Brain&&window.Brain.contextBlock())||''}catch(e){}
    var tools=[];try{tools=(window.AITools&&window.AITools.defs)||[]}catch(e){}
    var wire=msgs.slice();
    function post(n){
      n=n||0;
      function again(){return new Promise(function(res){setTimeout(res,n<1?1200:2600)}).then(function(){return post(n+1)});}
      return fetch(CHAT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:1200,system:SYS,memory:mem,messages:wire,tools:tools})})
        .catch(function(e){if(n<2)return again();throw e})
        .then(function(r){
          if((r.status===502||r.status===503||r.status===504)&&n<2)return again();
          return r.json().catch(function(){return{}}).then(function(d){
            if(!r.ok||(d&&d.error))throw new Error((d&&d.error)||'Clara lagi sibuk sebentar. Coba kirim lagi ya.');
            return d;
          });
        });
    }
    var rounds=0;
    function step(){
      return post().then(function(d){
        if(d&&Array.isArray(d.tool_calls)&&d.tool_calls.length&&window.AITools&&rounds<3){
          rounds++;
          var calls=d.tool_calls.slice(0,4);
          wire.push({role:'assistant',content:d.text||'',tool_calls:calls.map(function(c){return{id:c.id,type:'function',function:{name:c.name,arguments:JSON.stringify(c.args||{})}}})});
          return Promise.all(calls.map(function(c){
            return Promise.resolve(window.AITools.run(c.name,c.args)).then(function(res){
              return {role:'tool',tool_call_id:c.id,content:JSON.stringify(res).slice(0,1800)};
            });
          })).then(function(trs){
            trs.forEach(function(t){wire.push(t)});
            return step();
          });
        }
        return d;
      });
    }
    return step().then(function(d){
      var list=Array.isArray(d.bubbles)?d.bubbles.slice(0):null;
      if(!list){var t=Array.isArray(d.content)?d.content.map(function(c){return c.type==='text'?c.text:''}).join(''):(d.reply||d.text||'');list=[t]}
      list=list.map(function(x){return String(x||'').trim()}).filter(Boolean);
      if(!list.length)list=['oke'];
      return list;
    });
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();var t=inp.value.trim();if(!t||busy)return;
    M.push({r:'u',t:t.slice(0,2000),d:Date.now()});save();inp.value='';fit();busy=true;upd();render(true);var d=dots();end();
    ask().then(function(list){
      var i=0;
      (function next(){
        if(i<list.length){
          M.push({r:'a',t:list[i],d:Date.now()});save();render(true);end();i++;
          setTimeout(next,list.length>1?420:0);
        }else{busy=false;upd();end();softSync()}
      })();
    },
      function(er){busy=false;d.remove();upd();var m=!navigator.onLine?'Kamu sedang offline. Catatan dan tugas tetap bisa kamu ubah, chat nyala lagi begitu internet kembali.':(er&&er.message?er.message:'Gagal menghubungi server.');bub('a err',m);end()});
  });
  /* [10 Nov] Tool AI menulis ke penyimpanan; muat ulang sekali agar semua
     layar ikut memperlihatkan perubahan, lalu chat dibuka kembali otomatis. */
  function softSync(){
    try{
      if(window.AITools&&window.AITools.needsReload){
        window.AITools.clearReload();
        sessionStorage.setItem('md_reopen_chat','1');
        setTimeout(function(){location.reload()},1400);
      }
    }catch(e){}
  }
  inp.addEventListener('input',function(){fit();upd()});
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&window.matchMedia('(pointer:fine)').matches){e.preventDefault();if(!send.disabled)form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{cancelable:true}))}});
  function navHome(){var nb=document.querySelectorAll('.nb');nb.forEach(function(x){x.classList.remove('on')});if(nb[0])nb[0].classList.add('on')}
  function openC(){render();chat.classList.add('open');chat.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';upd();end()}
  function closeC(){closeAct();try{toggleSearch(false)}catch(e){}chat.classList.remove('open');chat.setAttribute('aria-hidden','true');var _o=document.querySelector('.cal.open:not(#chat)');document.body.style.overflow=_o?'hidden':'';if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();navHome()}
  $('openChat').addEventListener('click',openC);
  try{
    if(sessionStorage.getItem('md_reopen_chat')){
      sessionStorage.removeItem('md_reopen_chat');
      setTimeout(openC,120);
    }
  }catch(e){}
  $('chatBack').addEventListener('click',closeC);
  /* Menu titik 3 percakapan: cari, simpan, salin, hapus */
  var skw='';
  function say(t){
    var el=$('cToast'),sp=$('cMsg');
    if(!el||!sp)return;
    sp.textContent=t;el.hidden=false;
    clearTimeout(say._t);say._t=setTimeout(function(){el.hidden=true},2400);
  }
  function transcript(){
    return M.map(function(m){return (m.r==='u'?'Aku':'Clara')+': '+m.t}).join('\n');
  }
  function toNotes(){
    if(!M.length){say('Belum ada pesan');return}
    var d=new Date(),NM=['Jan','Feb','Mar','Apr','Mei','Jun','Agu','Sep','Okt','Nov','Des'];
    var arr=[];
    try{arr=JSON.parse(localStorage.getItem('catatan'))||[]}catch(e){arr=[]}
    if(!Array.isArray(arr))arr=[];
    arr.unshift({id:(Math.random().toString(36)+'000000').slice(2,8),t:'Chat '+d.getDate()+' '+NM[d.getMonth()],b:transcript(),m:Date.now()});
    try{localStorage.setItem('catatan',JSON.stringify(arr));try{window.dispatchEvent(new CustomEvent('md:notes'))}catch(e){}say('Disimpan ke Catatan')}
    catch(e){say('Gagal menyimpan')}
  }
  function toggleSearch(open){
    var bar=$('chatSearch');if(!bar)return;
    var buka=typeof open==='boolean'?open:bar.hidden;
    bar.hidden=!buka;
    if(buka){
      setTimeout(function(){var i=$('chatSearchInp');if(i)i.focus()},60);
    }else{
      var i2=$('chatSearchInp');if(i2)i2.value='';
      skw='';render();
    }
  }
  (function(){
    var i=$('chatSearchInp'),c=$('chatSearchClose');
    if(i)i.addEventListener('input',function(){skw=i.value;render()});
    if(c)c.addEventListener('click',function(){toggleSearch(false)});
  })();
  $('chatMenu').addEventListener('click',function(){
    window.popMenu(this,[
      {l:'Cari pesan',f:function(){toggleSearch(true)}},
      {l:'Simpan ke Catatan',f:toNotes},
      {l:'Salin semua teks',f:function(){if(!M.length){say('Belum ada pesan');return}copyT(transcript());say('Percakapan disalin')}},
      {l:'Hapus chat',d:1,f:function(){M=[];save();render();say('Chat dihapus')}}
    ]);
  });

  /* Aksi pesan: tekan lama (atau klik kanan) pada gelembung -> reaksi + menu */
  var RX=['\u2764\uFE0F','\uD83D\uDC4D','\uD83D\uDE02','\uD83D\uDE2E','\uD83D\uDE22','\uD83D\uDD25','\uD83D\uDE0D','\uD83E\uDD79','\uD83D\uDE4F','\uD83D\uDC4F','\uD83C\uDF89','\uD83D\uDE2D','\uD83E\uDD14','\uD83D\uDE21','\uD83D\uDC4E','\uD83D\uDCAF','\uD83D\uDE0E','\uD83E\uDD23'];
  var IC_COPY='<rect x="9" y="9" width="11" height="11" rx="3"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>';
  var IC_DEL='<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>';
  var actWrap=null,lpT=null,lpX=0,lpY=0;
  function closeAct(){if(actWrap){actWrap.remove();actWrap=null}}
  function copyT(t){
    try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).catch(function(){});return}}catch(e){}
    try{var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}catch(e){}
  }
  function openAct(b){
    var i=+b.dataset.i,m=M[i];if(!m||actWrap)return;
    try{var sel=window.getSelection&&window.getSelection();if(sel)sel.removeAllRanges()}catch(e){}
    var r=b.getBoundingClientRect(),me=m.r==='u';
    var wrap=document.createElement('div');wrap.className='rxwrap';
    wrap.addEventListener('pointerdown',function(e){if(e.target===wrap)closeAct()});
    var k=b.cloneNode(true);k.removeAttribute('data-i');k.classList.remove('baru');k.classList.add('rx-klon');
    k.style.cssText='left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px';
    wrap.appendChild(k);
    var p=document.createElement('div');p.className='rxpick';
    var row=document.createElement('div');row.className='rx-row';
    RX.forEach(function(e){
      var t=document.createElement('button');t.type='button';t.textContent=e;if(m.x===e)t.className='mine';
      t.addEventListener('click',function(ev){ev.stopPropagation();closeAct();if(m.x===e)delete m.x;else m.x=e;save();render()});
      row.appendChild(t);
    });
    p.appendChild(row);wrap.appendChild(p);
    var menu=document.createElement('div');menu.className='msgmenu';
    var wk=jamLabel(m.d);if(wk){var tm=document.createElement('div');tm.className='mm-time';tm.textContent=wk;menu.appendChild(tm)}
    function item(label,ic,fn,bad){
      var t=document.createElement('button');t.type='button';if(bad)t.className='bahaya';
      t.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+ic+'</svg>';
      var sp=document.createElement('span');sp.textContent=label;t.appendChild(sp);
      t.addEventListener('click',function(ev){ev.stopPropagation();fn()});
      menu.appendChild(t);
    }
    item('Salin',IC_COPY,function(){closeAct();copyT(m.t)});
    var sep=document.createElement('div');sep.className='mm-sep';menu.appendChild(sep);
    item('Hapus',IC_DEL,function(){closeAct();M.splice(i,1);save();render()},true);
    wrap.appendChild(menu);document.body.appendChild(wrap);
    var vw=window.innerWidth,vh=window.innerHeight;
    var ph=p.offsetHeight||48,pw=p.offsetWidth||250,mh=menu.offsetHeight||120,mw=menu.offsetWidth||200;
    var gap=8,atas=8,bawah=vh-12,gp=ph+gap,naik=0;
    var butuh=r.bottom+gap+mh-bawah;if(butuh>0)naik=butuh;
    if(r.top-naik-gp<atas)naik=Math.max(0,r.top-gp-atas);
    var bt=r.top-naik,bb=r.bottom-naik;
    k.style.top=bt+'px';
    p.style.top=Math.max(atas,bt-gp)+'px';
    p.style.left=Math.max(8,Math.min(vw-pw-8,me?r.right-pw:r.left))+'px';
    var mt=bb+gap;if(mt+mh>bawah)mt=Math.max(atas,bawah-mh);
    menu.style.top=mt+'px';
    menu.style.left=Math.max(8,Math.min(vw-mw-8,me?r.right-mw:r.left))+'px';
    actWrap=wrap;
  }
  function bubOf(e){var b=e.target.closest&&e.target.closest('.cm[data-i]');return b&&list.contains(b)?b:null}
  function lpStop(){if(lpT){clearTimeout(lpT);lpT=null}}
  list.addEventListener('pointerdown',function(e){
    if(e.button>0)return;var b=bubOf(e);if(!b)return;
    lpX=e.clientX;lpY=e.clientY;lpStop();
    lpT=setTimeout(function(){lpT=null;openAct(b)},420);
  });
  list.addEventListener('pointermove',function(e){if(lpT&&(Math.abs(e.clientX-lpX)>8||Math.abs(e.clientY-lpY)>8))lpStop()});
  ['pointerup','pointercancel','pointerleave'].forEach(function(n){list.addEventListener(n,lpStop)});
  list.addEventListener('contextmenu',function(e){var b=bubOf(e);if(!b)return;e.preventDefault();lpStop();openAct(b)});
  list.addEventListener('click',function(e){
    var g=e.target.closest&&e.target.closest('.brx');if(!g)return;
    var b=g.closest('.cm'),m=b&&M[+b.dataset.i];if(m){delete m.x;save();render()}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAct()});
})();
;

/* Kalkulator: ekspresi aman tanpa eval, hasil langsung terlihat. */
(function(){
  var sec=document.getElementById('kalk');
  if(!sec)return;
  var $=function(i){return document.getElementById(i)};
  var exEl=$('kExpr'),resEl=$('kRes'),pad=$('kPad');
  var expr='',done=false;
  var OPS={'+':1,'-':1,'*':1,'/':1};
  function isOp(c){return !!OPS[c]}
  function fmt(n){
    if(!isFinite(n))return 'Tidak terdefinisi';
    var neg=n<0;n=Math.abs(n);
    var str=n.toFixed(8).replace(/0+$/,'').replace(/\.$/,'');
    var pt=str.split('.'),ip=pt[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'),dp=pt[1];
    return (neg?'-':'')+ip+(dp?','+dp:'');
  }
  function ev(src){
    var i=0,t=[],num='';
    while(i<src.length){
      var c=src.charAt(i);
      if('0123456789.'.indexOf(c)>=0){num+=c;i++;continue}
      if(c==='%'){
        if(num!==''){num=String(parseFloat(num)/100)}
        else if(t.length&&typeof t[t.length-1]==='number'){t[t.length-1]=t[t.length-1]/100}
        i++;continue;
      }
      if(isOp(c)){
        if(num!==''&&num!=='-'){t.push(parseFloat(num));num=''}
        else if(num==='-'&&c==='-'){num='';continue}
        if(!t.length||typeof t[t.length-1]==='string'){if(c==='-'){num='-';i++;continue}if(!t.length)return NaN}
        if(typeof t[t.length-1]==='string')t[t.length-1]=c;
        else t.push(c);
        i++;continue;
      }
      i++;
    }
    if(num!==''&&num!=='-')t.push(parseFloat(num));
    if(!t.length)return NaN;
    if(typeof t[t.length-1]==='string')t.pop();
    var st=[t[0]];
    for(var j=1;j<t.length;j+=2){
      var o=t[j],v=t[j+1];
      if(o==='*')st[st.length-1]*=v;
      else if(o==='/')st[st.length-1]/=v;
      else if(o==='-')st.push(-v);
      else st.push(v);
    }
    var out=st[0];
    for(var m=1;m<st.length;m++)out+=st[m];
    return out;
  }
  function show(){
    var disp=expr.replace(/\*/g,'\u00d7').replace(/\//g,'\u00f7').replace(/-/g,'\u2212').replace(/\./g,',');
    exEl.textContent=disp||'0';
    if(done){resEl.innerHTML='&nbsp;';return}
    if(!/[+\-*/]/.test(expr)){resEl.innerHTML='&nbsp;';return}
    var v=ev(expr);
    resEl.textContent=isFinite(v)?'= '+fmt(v):'';
  }
  function key(k){
    if(k==='ac'){expr='';done=false;show();return}
    if(k==='del'){if(done){expr='';done=false}else expr=expr.slice(0,-1);show();return}
    if(k==='eq'){
      if(!expr||isOp(expr.charAt(expr.length-1)))return;
      var v=ev(expr);
      exEl.textContent=expr.replace(/\*/g,'\u00d7').replace(/\//g,'\u00f7').replace(/-/g,'\u2212').replace(/\./g,',')+' =';
      resEl.textContent=fmt(v);
      if(isFinite(v)){expr=String(+v.toFixed(10));done=true}
      else{done=true;expr=''}
      return;
    }
    if(k==='pct'){
      var pm=expr.match(/(\d*\.?\d+)$/);
      if(!pm)return;
      var num=parseFloat(pm[1])/100;
      expr=expr.slice(0,expr.length-pm[1].length)+String(num);
      show();return;
    }
    if(k==='neg'){
      var nm=expr.match(/(\d*\.?\d+)$/);
      if(!nm)return;
      var val=parseFloat(nm[1]);
      var rep=String(-val);
      if(nm[1].indexOf('.')<0)rep=String(-val);
      expr=expr.slice(0,expr.length-nm[1].length)+(val===0?'-0':rep);
      show();return;
    }
    if(done){expr='';done=false}
    if(isOp(k)){
      if(!expr){if(k==='-')expr='-';show();return}
      if(isOp(expr.charAt(expr.length-1)))expr=expr.slice(0,-1);
      if(expr==='-'&&k!=='-'){expr='';show();return}
      expr+=k;show();return;
    }
    if(k==='.'){
      var tail=expr.match(/(\d*\.?\d*)$/)[0];
      if(tail.indexOf('.')>=0)return;
      if(!tail)expr+='0';
      expr+='.';show();return;
    }
    expr+=k;show();
  }
  pad.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button[data-k]');
    if(!b)return;
    if(navigator.vibrate)try{navigator.vibrate(8)}catch(x){}
    key(b.dataset.k);
  });
  document.addEventListener('keydown',function(e){
    if(!sec.classList.contains('open'))return;
    var tg=e.target;
    if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'||tg.isContentEditable))return;
    var kp=document.getElementById('kurs');
    if(kp&&kp.classList.contains('open'))return;
    var k=e.key;
    if(/^[0-9]$/.test(k)||k==='.'||k==='+'||k==='-'||k==='*'||k==='/'){key(k);e.preventDefault()}
    else if(k==='Enter'||k==='='){key('eq');e.preventDefault()}
    else if(k==='Backspace'){key('del');e.preventDefault()}
    else if(k==='Escape'){key('ac')}
  });
  $('openKalk').addEventListener('click',function(){
    if(sec.classList.contains('open'))return;
    ['keu','feed','chat','prof','cal','task','note','jam'].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||!el.classList.contains('open'))return;
      var back=document.getElementById(id+'Back');
      if(back)back.click();
    });
    sec.classList.add('open');sec.setAttribute('aria-hidden','false');sec.scrollTop=0;
    document.body.style.overflow='hidden';
  });
  $('kalkBack').addEventListener('click',function(){
    sec.classList.remove('open');sec.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    var nb=document.querySelectorAll('.nav .nb');
    Array.prototype.forEach.call(nb,function(x){x.classList.remove('on')});
    if(nb[0])nb[0].classList.add('on');
  });
  show();
})();


/* Musik: pemutar lagu dari perangkat, file disimpan di IndexedDB. */
(function(){
  var sec=document.getElementById('musik');
  if(!sec)return;
  var $=function(i){return document.getElementById(i)};
  var audio=$('mAudio'),fileInp=$('mFile'),dirInp=$('mDir'),listEl=$('mList'),emp=$('mEmpty');
  // Di dalam APK (WebView) pemilih folder web tidak tersedia: input webkitdirectory
  // diabaikan dan showDirectoryPicker tidak ada. Jadi tawarkan pilih banyak lagu.
  var SHELL=!!window.MdNotify;
  // Di APK, folder perangkat dibaca langsung oleh sisi Android (SAF): tidak ada lagu
  // yang disalin ke IndexedDB, daftar & pemutaran datang dari MusicController.
  var NATIVE=!!(window.MdNotify&&typeof window.MdNotify.musicSupported==='function'&&window.MdNotify.musicSupported());
  var NDUR=0,NPLAY=false,NTITLE='';
  var tEl=$('mTitle'),sEl=$('mSub'),cEl=$('mCur'),dEl=$('mDur'),seek=$('mSeek'),playBtn=$('mPlay'),cnt=$('mCount');
  var DB='mydaily-musik',ST='tracks',MT='meta',DB_VER=2,db=null,mem=[],useMem=false;
  var tracks=[],cur=-1,objUrl=null,seeking=false,restored=false;
  var STATE='mydaily_musik_state',lastSave=0;
  function openDB(cb){
    try{
      var r=indexedDB.open(DB,DB_VER);
      r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains(ST))d.createObjectStore(ST,{keyPath:'id',autoIncrement:true});if(!d.objectStoreNames.contains(MT))d.createObjectStore(MT)};
      r.onsuccess=function(){db=r.result;cb()};
      r.onerror=function(){useMem=true;cb()};
    }catch(e){useMem=true;cb()}
  }
  function all(cb){
    if(useMem)return cb(mem.slice());
    try{
      var st=db.transaction(ST,'readonly').objectStore(ST).getAll();
      st.onsuccess=function(){cb(st.result||[])};
      st.onerror=function(){cb([])};
    }catch(e){cb([])}
  }
  function put(items,blobs,cb){
    if(useMem){
      blobs.forEach(function(b,i){mem.push({id:'m'+Date.now()+i,name:items[i].name,blob:b})});
      return cb();
    }
    try{
      var tx=db.transaction(ST,'readwrite'),os=tx.objectStore(ST);
      items.forEach(function(it,i){os.add({name:it.name,type:it.type,size:it.size,blob:blobs[i],date:Date.now()})});
      tx.oncomplete=function(){cb()};tx.onerror=function(){cb()};
    }catch(e){cb()}
  }
  function delAll(cb){
    if(useMem){mem=[];return cb()}
    try{var tx=db.transaction(ST,'readwrite');tx.objectStore(ST).clear();tx.oncomplete=function(){cb()};tx.onerror=function(){cb()}}catch(e){cb()}
  }
  function name(t){return String(t||'').replace(/\.[a-z0-9]{2,5}$/i,'')}
  function tstr(v){
    if(!isFinite(v)||v<0)v=0;
    var m=Math.floor(v/60),s2=Math.floor(v%60);
    return m+':'+(s2<10?'0':'')+s2;
  }
  function saveState(){
    if(cur<0||!tracks[cur])return;
    try{localStorage.setItem(STATE,JSON.stringify({id:String(tracks[cur].id),pos:audio.currentTime||0,ts:Date.now()}))}catch(e){}
  }
  function clearState(){try{localStorage.removeItem(STATE)}catch(e){}}
  function restoreLast(){
    if(restored)return;
    restored=true;
    var raw=null;
    try{raw=localStorage.getItem(STATE)}catch(e){}
    if(!raw)return;
    var st=null;
    try{st=JSON.parse(raw)}catch(e){return}
    if(!st||st.id==null)return;
    var idx=-1;
    for(var k=0;k<tracks.length;k++){if(String(tracks[k].id)===String(st.id)){idx=k;break}}
    if(idx<0){clearState();return}
    var t=tracks[idx],pos=Math.max(0,+st.pos||0);
    cur=idx;
    if(objUrl)URL.revokeObjectURL(objUrl);
    objUrl=URL.createObjectURL(t.blob);
    audio.src=objUrl;
    tEl.textContent=name(t.name);
    sEl.textContent='Melanjutkan';
    function apply(){
      try{audio.currentTime=pos}catch(e){}
      cEl.textContent=tstr(pos);
      if(audio.duration>0){dEl.textContent=tstr(audio.duration);seek.value=Math.round(pos/audio.duration*1000)}
    }
    if(audio.readyState>=1)apply();else audio.addEventListener('loadedmetadata',apply,{once:true});
    render();
    audio.play().catch(function(){setPlay(false);sEl.textContent='Terakhir diputar \u00b7 ketuk putar'});
  }
  function render(){
    listEl.innerHTML='';
    tracks.forEach(function(t,i){
      var r=document.createElement('div');
      r.className='mrow'+(i===cur?' on':'');
      r.dataset.i=i;
      var th=document.createElement('span');th.className='mth';
      th.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18.2" r="2.6" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16.2" r="2.6" fill="currentColor" stroke="none"/></svg>';
      r.appendChild(th);
      var nm=document.createElement('div');nm.className='mn';nm.textContent=name(t.name);r.appendChild(nm);
      if(i===cur){var eq=document.createElement('span');eq.className='meq';eq.innerHTML='<b></b><b></b><b></b>';r.appendChild(eq)}
      r.addEventListener('click',function(){play(i)});
      listEl.appendChild(r);
    });
    cnt.textContent=tracks.length+' lagu';
    emp.hidden=tracks.length>0;
    sec.classList.toggle('empty',tracks.length===0);
    if(cur<0){
      tEl.textContent='Belum ada lagu';
      sEl.textContent=tracks.length?'Ketuk salah satu lagu untuk memutar':'Tambahkan lagu dari perangkatmu';
    }
  }
  function setPlay(on){
    playBtn.innerHTML=on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none"/></svg>';
    playBtn.setAttribute('aria-label',on?'Jeda':'Putar');
  }
  function play(i){
    if(!tracks.length)return;
    if(NATIVE){if(i<0)i=tracks.length-1;if(i>=tracks.length)i=0;try{window.MdNotify.musicPlay(i)}catch(e){}return}
    if(i<0)i=tracks.length-1;
    if(i>=tracks.length)i=0;
    var t=tracks[i];
    cur=i;
    if(objUrl)URL.revokeObjectURL(objUrl);
    objUrl=URL.createObjectURL(t.blob);
    audio.src=objUrl;
    audio.play().catch(function(){});
    tEl.textContent=name(t.name);
    sEl.textContent='Memutar';
    seek.value=0;cEl.textContent='0:00';dEl.textContent='0:00';
    render();
    if('mediaSession' in navigator){
      try{navigator.mediaSession.metadata=new MediaMetadata({title:name(t.name),artist:'My Daily',album:'Perangkat'})}catch(e){}
    }
  }
  function toggle(){
    if(NATIVE){try{window.MdNotify.musicToggle()}catch(e){}return}
    if(cur<0){if(tracks.length)play(0);return}
    if(audio.paused){audio.play().catch(function(){})}else{audio.pause()}
  }
  audio.addEventListener('play',function(){setPlay(true);sEl.textContent='Memutar';var c=$('mCover');if(c)c.classList.add('playing')});
  audio.addEventListener('playing',saveState);
  audio.addEventListener('pause',function(){var c=$('mCover');if(c)c.classList.remove('playing');saveState();setPlay(false);if(audio.currentTime>0&&audio.currentTime<(audio.duration||0))sEl.textContent='Dijeda'});
  audio.addEventListener('loadedmetadata',function(){dEl.textContent=tstr(audio.duration)});
  audio.addEventListener('seeked',saveState);
  audio.addEventListener('timeupdate',function(){
    if(seeking)return;
    var d=audio.duration||0;
    cEl.textContent=tstr(audio.currentTime);
    if(d>0)seek.value=Math.round(audio.currentTime/d*1000);
    if(Date.now()-lastSave>2000){lastSave=Date.now();saveState()}
  });
  audio.addEventListener('ended',function(){if(tracks.length>1)play(cur+1);else{setPlay(false);clearState();seek.value=0;cEl.textContent='0:00';sEl.textContent='Selesai'}});
  seek.addEventListener('pointerdown',function(){seeking=true});
  seek.addEventListener('input',function(){
    var d=audio.duration||0;
    if(d>0)cEl.textContent=tstr(seek.value/1000*d);
  });
  seek.addEventListener('change',function(){
    if(NATIVE){
      if(NDUR>0){try{window.MdNotify.musicSeek(Math.round(seek.value/1000*NDUR))}catch(e){}}
      seeking=false;return;
    }
    var d=audio.duration||0;
    if(d>0)audio.currentTime=seek.value/1000*d;
    seeking=false;
  });
  seek.addEventListener('pointerup',function(){setTimeout(function(){seeking=false},60)});
  /* --- mode native: daftar dan status datang dari MusicController --- */
  function nativeLoad(){
    if(!NATIVE)return;
    var list=[];
    try{list=JSON.parse(window.MdNotify.musicList()||'[]')}catch(e){list=[]}
    tracks=Array.isArray(list)?list:[];
    try{applyNative(JSON.parse(window.MdNotify.musicState()||'{}'))}catch(e){render()}
    render();
  }
  function applyNative(st){
    if(!st)return;
    NDUR=+st.durMs||0;NPLAY=!!st.playing;NTITLE=st.title||'';
    var idx=(typeof st.index==='number')?st.index:-1;
    if(idx!==cur){cur=idx;seek.value=0;cEl.textContent='0:00'}
    if(st.count&&tracks.length!==st.count)nativeLoad();
    tEl.textContent=st.title||(idx>=0&&tracks[idx]?name(tracks[idx].name):'Belum ada lagu');
    if(st.title)sEl.textContent=NPLAY?'Memutar':(st.posMs>0?'Dijeda':'Siap diputar');
    else if(!tracks.length)sEl.textContent='Pilih folder musik dari perangkat';
    dEl.textContent=tstr(NDUR/1000);
    if(!seeking)cEl.textContent=tstr((+st.posMs||0)/1000);
    if(NDUR>0&&!seeking)seek.value=Math.round((+st.posMs||0)/NDUR*1000);
    setPlay(NPLAY);
    var c=$('mCover');if(c){if(NPLAY)c.classList.add('playing');else c.classList.remove('playing')}
    render();
    pushMusic();
  }
  window.mdMusicNativeState=function(st){applyNative(st)};
  window.mdMusicNativeList=function(list){tracks=Array.isArray(list)?list:[];cur=-1;render()};
  window.mdMusicFolderPicked=function(){
    nativeLoad();
    var f='';try{f=window.MdNotify.musicFolder()||''}catch(e){}
    if(window.toast)toast(tracks.length?(tracks.length+' lagu dari '+(f||'folder perangkat')):'Tidak ada berkas audio di folder itu');
  };
  function pushMusic(){
    try{
      var BM=window.MdNotify;
      if(!BM||typeof BM.setMusic!=='function')return;
      var tr=tracks[cur];
      var title=NATIVE?(NTITLE||(tr?name(tr.name):'')):(tr?name(tr.name):'');
      var on=NATIVE?(NPLAY?'1':'0'):(audio.paused?'0':'1');
      BM.setMusic(title,on);
    }catch(e){}
  }
  window.mdMusic=function(a){
    if(a==='toggle'){toggle()}
    else if(a==='next'){if(tracks.length)play(cur+1)}
    else if(a==='prev'){if(audio.currentTime>4){audio.currentTime=0}else if(tracks.length){play(cur-1)}}
    pushMusic();
  };
  audio.addEventListener('play',pushMusic);
  audio.addEventListener('pause',pushMusic);
  audio.addEventListener('ended',pushMusic);
  playBtn.addEventListener('click',function(){toggle();pushMusic()});
  $('mNext').addEventListener('click',function(){if(NATIVE){try{window.MdNotify.musicNext()}catch(e){}return}if(tracks.length)play(cur+1)});
  $('mPrev').addEventListener('click',function(){
    if(NATIVE){try{window.MdNotify.musicPrev()}catch(e){}return}
    if(audio.currentTime>4){audio.currentTime=0;return}
    if(tracks.length)play(cur-1);
  });
  $('mAdd').addEventListener('click',function(){if(NATIVE){pickFolder();return}fileInp.click()});
  $('mEmptyAdd').addEventListener('click',function(){if(NATIVE){pickFolder();return}fileInp.click()});
  $('mEmptyDir').addEventListener('click',function(){pickFolder()});
  function metaGet(key,cb){
    if(useMem||!db)return cb(null);
    try{var st=db.transaction('meta','readonly').objectStore('meta').get(key);st.onsuccess=function(){cb(st.result||null)};st.onerror=function(){cb(null)}}catch(e){cb(null)}
  }
  function metaSet(key,val,cb){
    if(useMem||!db)return cb&&cb();
    try{var tx=db.transaction('meta','readwrite');tx.objectStore('meta').put(val,key);tx.oncomplete=function(){cb&&cb()};tx.onerror=function(){cb&&cb()}}catch(e){cb&&cb()}
  }
  function audioOk(f){return /^audio\//.test(f.type||'')||/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|wma|mp4|3gp|amr)$/i.test(f.name||'')}
  async function scanDir(h,depth){
    var out=[];
    try{
      for await (var e of h.values()){
        if(e.kind==='file'){try{var f=await e.getFile();if(audioOk(f))out.push(f)}catch(e2){}}
        else if(e.kind==='directory'&&depth>0){try{out=out.concat(await scanDir(e,depth-1))}catch(e3){}}
      }
    }catch(e){}
    return out;
  }
  async function syncFolder(announce){
    var h=null;
    await new Promise(function(res){metaGet('musicDir',function(v){h=v;res()})});
    if(!h||!h.queryPermission)return;
    var perm='denied';
    try{perm=await h.queryPermission({mode:'read'})}catch(e){}
    if(perm!=='granted'){
      if(!announce)return;
      try{perm=await h.requestPermission({mode:'read'})}catch(e){}
    }
    if(perm!=='granted'){if(announce&&window.toast)toast('Izin folder belum diberikan');return}
    var files=await scanDir(h,2);
    if(!files.length){if(announce&&window.toast)toast('Tidak ada berkas audio di folder itu');return}
    var known={};
    tracks.forEach(function(t){known[(t.name||'')+'|'+(t.size||0)]=1});
    var fresh=files.filter(function(f){return !known[(f.name||'')+'|'+(f.size||0)]});
    if(!fresh.length){if(announce&&window.toast)toast('Semua lagu di folder sudah masuk daftar');return}
    put(fresh.map(function(f){return {name:f.name,type:f.type,size:f.size}}),fresh,function(){
      all(function(list){tracks=list.slice().sort(function(a,b){return (+a.date||0)-(+b.date||0)});render()});
      if(window.toast)toast(fresh.length+' lagu baru dari folder');
    });
  }
  async function pickFolder(){
    if(NATIVE){
      try{window.MdNotify.musicPickFolder()}catch(e){
        if(window.toast)toast('Pemilih folder tidak bisa dibuka');
      }
      return;
    }
    if(!window.showDirectoryPicker){
      if(window.toast)toast('Browser ini belum mendukung folder otomatis. Pakai Tambah lagu atau Impor folder.');
      return;
    }
    try{
      var h=await window.showDirectoryPicker({mode:'read'});
      metaSet('musicDir',h,function(){syncFolder(true)});
    }catch(e){}
  }
  function addFiles(list){
    var fs=list.filter(function(f){return /^audio\//.test(f.type||'')||/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|wma|mp4|3gp|amr)$/i.test(f.name||'')});
    if(!fs.length){if(window.toast)toast('Tidak ada berkas audio yang dipilih');return}
    put(fs.map(function(f){return {name:f.name,type:f.type,size:f.size}}),fs,function(){
      fileInp.value='';dirInp.value='';
      load(true);
      if(window.toast)toast(fs.length+' lagu ditambahkan');
    });
  }
  fileInp.addEventListener('change',function(){addFiles(Array.prototype.slice.call(fileInp.files||[]))});
  dirInp.addEventListener('change',function(){addFiles(Array.prototype.slice.call(dirInp.files||[]))});
  $('mMenu').addEventListener('click',function(){
    var items=[
      {l:'Putar berikutnya',f:function(){if(tracks.length)play(cur+1)}}
    ];
    if(NATIVE){
      items.push({l:'Pilih folder perangkat',f:function(){pickFolder()}});
      items.push({l:'Pindai ulang folder',f:function(){nativeLoad();if(window.toast)toast('Daftar lagu diperbarui')}});
      items.push({l:'Lepas folder',f:function(){
        try{window.MdNotify.musicClearFolder()}catch(e){}
        tracks=[];cur=-1;NDUR=0;NPLAY=false;NTITLE='';render();
        if(window.toast)toast('Folder dilepas');
      }});
    }else if(SHELL){
      items.push({l:'Tambah banyak lagu',f:function(){fileInp.click()}});
      items.push({l:'Soal impor folder',f:function(){
        if(window.toast)toast('Di aplikasi, pemilih folder tidak tersedia. Pilih beberapa lagu sekaligus dari folder itu ya.');
      }});
    }else{
      items.push({l:'Impor folder musik',f:function(){dirInp.click()}});
      items.push({l:'Folder musik otomatis',f:function(){pickFolder()}});
    }
    items.push({l:'Hapus semua lagu',d:1,f:function(){
        if(!tracks.length)return;
        if(NATIVE){
          try{window.MdNotify.musicClearFolder()}catch(e){}
          tracks=[];cur=-1;NDUR=0;NPLAY=false;NTITLE='';render();
          if(window.toast)toast('Lagu dilepas dari daftar');
          return;
        }
        audio.pause();audio.removeAttribute('src');
        if(objUrl){URL.revokeObjectURL(objUrl);objUrl=null}
        cur=-1;clearState();delAll(function(){load();if(window.toast)toast('Semua lagu dihapus')});
      }});
    window.popMenu(this,items);
  });
  function load(announce){
    all(function(list){
      tracks=list.slice().sort(function(a,b){return (+a.date||0)-(+b.date||0)});
      if(cur>=tracks.length)cur=-1;
      render();
      if(announce&&cur<0&&tracks.length)sEl.textContent='Siap diputar';
    });
  }
  $('openMusik').addEventListener('click',function(){
    if(sec.classList.contains('open'))return;
    ['keu','feed','chat','prof','cal','task','note','jam','kalk'].forEach(function(id){
      var el=document.getElementById(id);
      if(!el||!el.classList.contains('open'))return;
      var back=document.getElementById(id+'Back');
      if(back)back.click();
    });
    sec.classList.add('open');sec.setAttribute('aria-hidden','false');sec.scrollTop=0;
    document.body.style.overflow='hidden';
    if(NATIVE)nativeLoad();
    else if(!db&&!useMem)openDB(function(){load()});
  });
  $('musikBack').addEventListener('click',function(){
    sec.classList.remove('open');sec.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    var nb=document.querySelectorAll('.nav .nb');
    Array.prototype.forEach.call(nb,function(x){x.classList.remove('on')});
    if(nb[0])nb[0].classList.add('on');
  });
  setPlay(false);
  if(NATIVE){
    nativeLoad();
  }else{
    openDB(function(){all(function(list){
      tracks=list.slice().sort(function(a,b){return (+a.date||0)-(+b.date||0)});
      render();restoreLast();
      setTimeout(function(){syncFolder(false)},900);
    })});
  }
})();

/* rute asli sebelum router menormalkan URL (dipakai skrip konverter di bawah) */
window.__bootPath=(location.pathname||"/").replace(/\/{2,}/g,"/").replace(/\/+$/,"")||"/";
/* Router: path bersih (History API), tanpa hash.
   /  /kalender  /kalender/agenda/baru
   /tugas  /tugas/belum  /tugas/selesai  /tugas/baru  /tugas/:id
   /catatan  /catatan/baru  /catatan/:id */
(function(){
  if(!/^https?:$/.test(location.protocol)||!window.history||!history.pushState)return;
  var $=function(i){return document.getElementById(i)};
  var cal=$('cal'),task=$('task'),note=$('note'),chat=$('chat'),feed=$('feed'),prof=$('prof'),keu=$('keu'),km=$('kModal'),jam=$('jam'),ja=$('jAModal'),ag=$('agModal'),tm=$('tModal'),nm=$('nModal'),tabs=$('tTabs'),kalk=$('kalk'),kurs=$('kurs'),satuan=$('satuan'),musik=$('musik');
  var TITLE='My Daily',NAMES={kalender:'Kalender',tugas:'Tugas',catatan:'Catatan',keuangan:'Keuangan',jam:'Jam',chat:'Clara',kalkulator:'Kalkulator',musik:'Musik',feed:'Feed',profil:'Profil'};
  var FIL={'/tugas':1,'/tugas/belum':1,'/tugas/selesai':1};
  var busy=false,cur='/',idx=0,stack=[];
  function isOpen(e){return e.classList.contains('open')}
  function click(e){if(e)e.click()}
  function filt(){var b=tabs.querySelector('.on');return b?b.dataset.f:'all'}
  function setTab(f){var b=tabs.querySelector('[data-f="'+f+'"]');if(b&&filt()!==f)b.click()}
  function norm(p){p=(p||'/').replace(/\/{2,}/g,'/').replace(/\/+$/,'');return p||'/'}
  function depth(p){return p==='/'?0:p.split('/').filter(Boolean).length}
  function title(p){var n=NAMES[p.split('/')[1]];document.title=n?n+' \u00b7 '+TITLE:TITLE}
  function st(){
    if(isOpen(chat))return '/chat';
    if(isOpen(feed))return '/feed';
    if(isOpen(prof))return '/profil';
    if(isOpen(keu))return km.hidden?'/keuangan':'/keuangan/baru';
    if(isOpen(jam))return ja.hidden?'/jam':'/jam/alarm/baru';
    if(isOpen(kurs))return '/kalkulator/mata-uang';
    if(isOpen(satuan))return '/kalkulator/satuan';
    if(isOpen(kalk))return '/kalkulator';
    if(isOpen(musik))return '/musik';
    if(isOpen(note))return nm.hidden?'/catatan':'/catatan/'+(nm.dataset.eid||'baru');
    if(isOpen(task)){
      if(!tm.hidden)return '/tugas/'+(tm.dataset.eid||'baru');
      var f=filt();return f==='todo'?'/tugas/belum':f==='done'?'/tugas/selesai':'/tugas';
    }
    if(isOpen(cal))return ag.hidden?'/kalender':'/kalender/agenda/baru';
    return '/';
  }
  function byId(sel,id){return /^[a-z0-9]{3,12}$/.test(id)?document.querySelector(sel+'[data-id="'+id+'"]'):null}
  function apply(path){
    busy=true;
    try{
      var seg=path.split('/').filter(Boolean),pg=seg[0],sub=seg.slice(1).join('/');
      /* Chat adalah lapisan di atas halaman aktif: membukanya tidak boleh menutup
         halaman asal, supaya tombol kembali balik ke halaman itu. */
      if(pg!=='chat'){
        if(pg!=='jam'&&isOpen(jam))click($('jamBack'));
        if(pg!=='kalkulator'){if(isOpen(kurs))click($('kursBack'));if(isOpen(satuan))click($('satuanBack'));if(isOpen(kalk))click($('kalkBack'))}
        if(pg!=='musik'&&isOpen(musik))click($('musikBack'));
        if(pg!=='keuangan'&&isOpen(keu)){if(!km.hidden)click($('kNo'));click($('keuBack'))}
        if(pg!=='feed'&&isOpen(feed))click($('feedBack'));
        if(pg!=='profil'&&isOpen(prof))click($('profBack'));
        if(pg!=='catatan'&&isOpen(note)){if(!nm.hidden)click($('nNo'));click($('noteBack'))}
        if(pg!=='tugas'&&isOpen(task)){if(!tm.hidden)click($('tNo'));click($('taskBack'))}
        if(pg!=='kalender'&&isOpen(cal)){if(!ag.hidden)click($('agNo'));click($('calBack'))}
      }
      if(pg==='kalender'){
        if(!isOpen(cal))click($('openCal'));
        var wa=sub==='agenda/baru';
        if(wa&&ag.hidden)click($('addAg'));
        if(!wa&&!ag.hidden)click($('agNo'));
      }else if(pg==='tugas'){
        if(!isOpen(task))click($('openTask'));
        var fm={'':'all',belum:'todo',selesai:'done'};
        if(Object.prototype.hasOwnProperty.call(fm,sub)){if(!tm.hidden)click($('tNo'));setTab(fm[sub])}
        else if(sub==='baru'){if(!tm.hidden&&tm.dataset.eid)click($('tNo'));if(tm.hidden)click($('addTask'))}
        else{
          if(filt()!=='all')setTab('all');
          if(!tm.hidden&&tm.dataset.eid!==sub)click($('tNo'));
          if(tm.hidden)click(byId('#tList .tsk-b',sub));
        }
      }else if(pg==='catatan'){
        if(!isOpen(note))click($('openNote2'));
        if(!sub){if(!nm.hidden)click($('nNo'))}
        else if(sub==='baru'){if(!nm.hidden&&nm.dataset.eid)click($('nNo'));if(nm.hidden)click($('addNote'))}
        else{
          if(!nm.hidden&&nm.dataset.eid!==sub)click($('nNo'));
          if(nm.hidden)click(byId('#nList .nt',sub));
        }
      }
      if(pg==='jam'){
        if(!isOpen(jam))click($('openJam'));
        if(sub==='alarm/baru'){
          if(ja.hidden){
            var at=$('jTabs').querySelector('[data-p="alarm"]');
            if(at)at.click();
            click($('jamAdd'));
          }
        }else if(!ja.hidden)click($('jaNo'));
      }
      if(pg==='keuangan'){
        if(!isOpen(keu))click($('openKeu'));
        if(sub==='baru'){if(km.hidden)click($('addKeu'))}
        else if(!km.hidden)click($('kNo'));
      }
      if(pg==='kalkulator'){
        if(!isOpen(kalk))click($('openKalk'));
        if(sub==='mata-uang'){if(isOpen(satuan))click($('satuanBack'));if(!isOpen(kurs))click($('kConv'))}
        else if(sub==='satuan'){if(isOpen(kurs))click($('kursBack'));if(!isOpen(satuan))click($('kRuler'))}
        else{if(isOpen(kurs))click($('kursBack'));if(isOpen(satuan))click($('satuanBack'))}
      }
      if(pg==='musik'&&!isOpen(musik))click($('openMusik'));
      if(pg==='feed'&&!isOpen(feed))click($('openFeed'));
      if(pg==='profil'&&!isOpen(prof))click($('openProf'));
      if(pg==='chat'&&!isOpen(chat))click($('openChat'));
      if(pg!=='chat'&&isOpen(chat))click($('chatBack'));
    }catch(e){}
    var d=st();cur=d;stack[idx]=d;
    if(norm(location.pathname)!==d){try{history.replaceState({i:idx},'',d)}catch(e){}}
    title(d);busy=false;
  }
  function navigate(d){
    var from=cur;cur=d;title(d);
    if(norm(location.pathname)===d)return;
    try{
      if(d==='/chat'&&from!=='/chat'){idx++;stack.length=idx;stack[idx]=d;history.pushState({i:idx},'',d)}
      else if(FIL[from]&&FIL[d]){history.replaceState({i:idx},'',d);stack[idx]=d}
      else if(depth(d)>depth(from)){idx++;stack.length=idx;stack[idx]=d;history.pushState({i:idx},'',d)}
      else if(idx>0&&stack[idx-1]===d){history.back()}
      else{history.replaceState({i:idx},'',d);stack[idx]=d}
    }catch(e){}
  }
  var mo=new MutationObserver(function(){if(busy)return;var d=st();if(d!==cur)navigate(d)});
  [cal,task,note,keu,jam,ja,chat,feed,prof,ag,tm,nm,km,kalk,kurs,satuan,musik].forEach(function(e){mo.observe(e,{attributes:true,attributeFilter:['class','hidden','data-eid']})});
  mo.observe(tabs,{attributes:true,attributeFilter:['class'],subtree:true});
  window.applyRoute=apply;
  window.addEventListener('popstate',function(e){idx=(e.state&&e.state.i)||0;apply(norm(location.pathname))});
  apply(norm(location.pathname));
  requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('rboot')})});
})();
;
(function(){
  var sec=document.getElementById('prof'),bar=document.getElementById('pfBar'),hero=document.getElementById('pfHero');
  if(!sec||!bar||!hero)return;
  function s(){bar.style.setProperty('--ph',hero.offsetHeight+'px');bar.style.setProperty('--pw',hero.offsetWidth+'px')}
  s();window.addEventListener('resize',s);window.addEventListener('load',s);
  if(window.ResizeObserver)new ResizeObserver(s).observe(hero);
  sec.addEventListener('scroll',function(){bar.classList.toggle('on',sec.scrollTop>6)},{passive:true});
})();
