/* Konverter mata uang: 3 baris, ketuk baris untuk mengetik, kurs harian dari open.er-api.com (cache 12 jam). */
(function(){
  var wrap=document.getElementById('cvWrap');if(!wrap)return;
  function $(id){return document.getElementById(id)}
  var rowsEl=$('cvRows'),pad=$('cvPad'),fn=$('cvFn'),ov=$('cvOv'),q=$('cvQ'),list=$('cvList'),shT=$('cvShT'),page=$('kurs');
  var CUR=[['IDR','Rupiah Indonesia','ID'],['USD','Dolar Amerika','US'],['EUR','Euro','EU'],['SGD','Dolar Singapura','SG'],['MYR','Ringgit Malaysia','MY'],['JPY','Yen Jepang','JP'],['GBP','Pound Inggris','GB'],['AUD','Dolar Australia','AU'],['CNY','Yuan Tiongkok','CN'],['SAR','Riyal Arab Saudi','SA'],['HKD','Dolar Hong Kong','HK'],['THB','Baht Thailand','TH'],['KRW','Won Korea Selatan','KR'],['INR','Rupee India','IN'],['PHP','Peso Filipina','PH'],['VND','Dong Vietnam','VN'],['AED','Dirham UEA','AE'],['CAD','Dolar Kanada','CA'],['CHF','Franc Swiss','CH'],['NZD','Dolar Selandia Baru','NZ'],['TWD','Dolar Taiwan','TW'],['BND','Dolar Brunei','BN'],['TRY','Lira Turki','TR'],['ZAR','Rand Afrika Selatan','ZA'],['BRL','Real Brasil','BR'],['PKR','Rupee Pakistan','PK']];
  var NAMA={},FLAG={};
  function flag(cc){try{return String.fromCodePoint.apply(null,cc.split('').map(function(c){return 127397+c.charCodeAt(0)}))}catch(e){return cc}}
  CUR.forEach(function(c){NAMA[c[0]]=c[1];FLAG[c[0]]=flag(c[2])});
  var KEY='md_kurs_idr',SEL='md_konversi2',FN='Kurs tengah, bukan kurs jual\u2013beli bank atau money changer.';
  var rates=null,stamp=0,sheetFor=-1;
  var st={c:['IDR','USD','EUR'],i:0,x:'1'};
  try{
    var sv=JSON.parse(localStorage.getItem(SEL));
    if(sv&&sv.c&&sv.c.length===3&&sv.c.every(function(c){return NAMA[c]})&&sv.c[0]!==sv.c[1]&&sv.c[1]!==sv.c[2]&&sv.c[0]!==sv.c[2]){
      st.c=sv.c;st.i=(sv.i>=0&&sv.i<3)?sv.i:0;st.x=norm(sv.x||'');
    }
  }catch(e){}
  function save(){try{localStorage.setItem(SEL,JSON.stringify(st))}catch(e){}}
  /* ---- angka ---- */
  function norm(raw){
    raw=String(raw).replace(/[^0-9,]/g,'');
    var i=raw.indexOf(','),ip=i<0?raw:raw.slice(0,i),dp=i<0?'':raw.slice(i+1).replace(/,/g,'');
    ip=ip.replace(/^0+(?=\d)/,'').slice(0,15);
    return i<0?ip:ip+','+dp.slice(0,6);
  }
  function disp(x){
    var i=x.indexOf(','),ip=i<0?x:x.slice(0,i);
    ip=(ip||'0').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    return i<0?ip:ip+','+x.slice(i+1);
  }
  function num(x){var n=parseFloat(String(x).replace(',','.'));return isFinite(n)?n:0}
  function dec(code){return(code==='IDR'||code==='JPY'||code==='KRW'||code==='VND')?0:2}
  function fmtOut(v,code){
    var d=dec(code);
    try{
      if(v!==0&&Math.abs(v)<(d?0.01:1))return new Intl.NumberFormat('id-ID',{maximumSignificantDigits:3}).format(v);
      return new Intl.NumberFormat('id-ID',{minimumFractionDigits:0,maximumFractionDigits:d}).format(v);
    }catch(e){return String(v)}
  }
  function toRaw(v,code){
    if(!v)return '';
    var d=Math.abs(v)<0.01?6:dec(code);
    var t=v.toFixed(d);if(t.indexOf('.')>=0)t=t.replace(/0+$/,'').replace(/\.$/,'');
    return norm(t.replace('.',','));
  }
  /* ---- tampilan ---- */
  function size(len){return len<=9?'':len<=12?'1.65rem':len<=15?'1.35rem':'1.1rem'}
  function render(){
    var ai=st.i,ac=st.c[ai],a=rates&&rates[ac],x=num(st.x);
    rowsEl.innerHTML='';
    st.c.forEach(function(c,j){
      var r=document.createElement('div'),v,z=false;
      r.className='cv-r'+(j===ai?' on':'');r.dataset.i=j;
      if(j===ai){v=st.x?disp(st.x):'0';z=!st.x}
      else if(a&&rates[c])v=fmtOut(x*rates[c]/a,c);
      else v='\u2013';
      r.innerHTML='<button class="cv-rc" type="button" data-p="'+j+'" aria-label="Ganti mata uang"><span class="cv-fl">'+FLAG[c]+'</span><b>'+c+'</b><i></i></button>'+
        '<div class="cv-rv"><div class="cv-n'+(z?' z':'')+'" style="font-size:'+size(v.length)+'">'+v+'</div><small>'+NAMA[c]+'</small></div>';
      rowsEl.appendChild(r);
    });
  }
  /* ---- keypad ---- */
  function key(k){
    var x=st.x;
    if(k==='ac')x='';
    else if(k==='del')x=x.slice(0,-1);
    else if(k===','){if(x.indexOf(',')<0)x=(x||'0')+','}
    else if(k==='00'){if(x&&x!=='0')x+='00'}
    else x+=k;
    st.x=norm(x);save();render();
  }
  pad.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(navigator.vibrate)try{navigator.vibrate(8)}catch(x){}
    key(b.dataset.k);
  });
  document.addEventListener('keydown',function(e){
    if(!page.classList.contains('open')||!ov.hidden||e.ctrlKey||e.metaKey||e.altKey)return;
    var t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;
    var k=e.key;
    if(/^[0-9]$/.test(k)){key(k);e.preventDefault()}
    else if(k===','||k==='.'){key(',');e.preventDefault()}
    else if(k==='Backspace'){key('del');e.preventDefault()}
  });
  /* ---- pilih baris & mata uang ---- */
  function activate(j){
    if(j===st.i)return;
    var ci=st.c[st.i],cj=st.c[j],a=rates&&rates[ci],b=rates&&rates[cj];
    if(a&&b)st.x=toRaw(num(st.x)*b/a,cj);
    st.i=j;save();render();
  }
  rowsEl.addEventListener('click',function(e){
    var p=e.target.closest('.cv-rc');
    if(p){openSheet(+p.dataset.p);return}
    var r=e.target.closest('.cv-r');if(r)activate(+r.dataset.i);
  });
  function buildList(f){
    f=(f||'').trim().toLowerCase();list.innerHTML='';
    var n=0,cur=st.c[sheetFor];
    CUR.forEach(function(c){
      if(f&&c[0].toLowerCase().indexOf(f)<0&&c[1].toLowerCase().indexOf(f)<0)return;n++;
      var on=c[0]===cur;
      var b=document.createElement('button');b.type='button';b.className='cv-it'+(on?' on':'');b.dataset.c=c[0];b.setAttribute('role','option');
      b.innerHTML='<span class="cv-fl">'+FLAG[c[0]]+'</span><span class="cv-cc"><b>'+c[0]+'</b><small>'+c[1]+'</small></span>'+(on?'<svg class="cv-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':'');
      list.appendChild(b);
    });
    if(!n)list.innerHTML='<div class="cv-emp">Mata uang tidak ditemukan</div>';
  }
  function openSheet(j){
    sheetFor=j;shT.textContent='Pilih mata uang';
    q.value='';buildList('');ov.hidden=false;
    var cur=list.querySelector('.on');if(cur)list.scrollTop=Math.max(0,cur.offsetTop-list.clientHeight/2+30);
  }
  function closeSheet(){ov.hidden=true;sheetFor=-1}
  function choose(code){
    var j=sheetFor,old=st.c[j],k=st.c.indexOf(code);
    if(k>=0&&k!==j)st.c[k]=old;
    st.c[j]=code;
    /* jika mata uang baris aktif berubah, nominal tetap sama */
    save();render();
  }
  q.addEventListener('input',function(){buildList(q.value)});
  list.addEventListener('click',function(e){var b=e.target.closest('.cv-it');if(!b||sheetFor<0)return;choose(b.dataset.c);closeSheet()});
  ov.addEventListener('click',function(e){if(e.target===ov)closeSheet()});
  /* ---- buka / tutup ---- */
  function open(){
    if(page.classList.contains('open'))return;
    page.classList.add('open');page.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
    load(false);
  }
  function close(){closeSheet();page.classList.remove('open');page.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  var btn=$('kConv');
  if(btn)btn.addEventListener('click',open);
  $('kursBack').addEventListener('click',close);
  /* ---- kurs ---- */
  function load(force){
    var c=null;
    try{c=JSON.parse(localStorage.getItem(KEY))}catch(e){}
    if(c&&c.rates&&!rates){rates=c.rates;stamp=c.ts;render()}
    if(!force&&c&&c.rates&&Date.now()-c.ts<12*3600*1000){fn.textContent=FN;return}
    fetch('https://open.er-api.com/v6/latest/IDR',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){
      if(!j||!j.rates||!j.rates.IDR)throw new Error('bad');
      rates=j.rates;stamp=Date.now();
      try{localStorage.setItem(KEY,JSON.stringify({ts:stamp,rates:rates}))}catch(e){}
      fn.textContent=FN;render();
    }).catch(function(){
      fn.textContent=rates?FN:'Kurs belum bisa dimuat. Periksa internet, lalu ketuk di sini.';
    });
  }
  fn.addEventListener('click',function(){if(!rates)load(true)});
  render();
})();

/* Pengonversi satuan: Panjang, Area, Volume, Massa, Suhu, Waktu. Basis tiap kategori = satuan SI. */
(function(){
  var wrap=document.getElementById('rgWrap');if(!wrap)return;
  var tabsEl=document.getElementById('unTabs'),rowsEl=document.getElementById('unRows'),noteEl=document.getElementById('unNote');
  var CAT=[
    {k:'panjang',n:'Panjang',u:[['m','Meter','m',1],['km','Kilometer','km',1000],['dm','Desimeter','dm',0.1],['cm','Sentimeter','cm',0.01],['mm','Milimeter','mm',0.001],['in','Inci','in',0.0254],['ft','Kaki','ft',0.3048],['yd','Yard','yd',0.9144],['mi','Mil','mi',1609.344]],d:['ft','cm','in']},
    {k:'area',n:'Area',u:[['m2','Meter persegi','m²',1],['km2','Kilometer persegi','km²',1e6],['cm2','Sentimeter persegi','cm²',1e-4],['ha','Hektare','ha',1e4],['ft2','Kaki persegi','ft²',0.09290304],['in2','Inci persegi','in²',0.00064516],['ac','Acre','ac',4046.8564224]],d:['m2','ha','ft2']},
    {k:'volume',n:'Volume',u:[['l','Liter','L',1],['ml','Mililiter','mL',0.001],['m3','Meter kubik','m³',1000],['cm3','Sentimeter kubik','cm³',0.001],['gal','Galon (AS)','gal',3.785411784],['qt','Quart (AS)','qt',0.946352946],['cup','Cangkir (AS)','cup',0.2365882365],['floz','Ons cairan (AS)','fl oz',0.0295735295625]],d:['l','ml','gal']},
    {k:'massa',n:'Massa',u:[['kg','Kilogram','kg',1],['g','Gram','g',0.001],['mg','Miligram','mg',1e-6],['t','Ton','t',1000],['lb','Pon','lb',0.45359237],['oz','Ons','oz',0.028349523125],['ons','Ons (100 g)','ons',0.1]],d:['kg','g','lb']},
    {k:'suhu',n:'Suhu',u:[['c','Celsius','°C'],['f','Fahrenheit','°F'],['k','Kelvin','K']],d:['c','f','k'],t:1},
    {k:'waktu',n:'Waktu',u:[['s','Detik','s',1],['min','Menit','mnt',60],['h','Jam','jam',3600],['d','Hari','hr',86400],['w','Minggu','mgg',604800],['ms','Milidetik','ms',0.001],['y','Tahun','thn',31557600]],d:['h','min','s']}
  ];
  var KEY='md_satuan',cat=0,sel=[],act=0,txt='1',pop=null;
  try{var st=JSON.parse(localStorage.getItem(KEY));if(st&&st.c>=0&&st.c<CAT.length){cat=st.c;if(st.s&&st.s.length===3)sel=st.s}}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({c:cat,s:sel}))}catch(e){}}
  function C(){return CAT[cat]}
  function U(code){return C().u.filter(function(x){return x[0]===code})[0]}
  function valid(){var ok=sel.length===3;if(ok)sel.forEach(function(x){if(!U(x))ok=false});if(!ok)sel=C().d.slice()}
  function toBase(code,v){
    if(C().t){if(code==='c')return v;if(code==='f')return (v-32)*5/9;return v-273.15}
    return v*U(code)[3];
  }
  function fromBase(code,b){
    if(C().t){if(code==='c')return b;if(code==='f')return b*9/5+32;return b+273.15}
    return b/U(code)[3];
  }
  function parse(t){var n=parseFloat(String(t).replace(/\./g,'').replace(',','.'));return isFinite(n)?n:NaN}
  function fmt(v){
    if(!isFinite(v))return '';
    if(v===0)return '0';
    var a=Math.abs(v),o;
    if(a>=1e15||a<1e-9)return v.toExponential(4).replace('.',',');
    o={maximumSignificantDigits:10};
    if(a>=1)o={maximumFractionDigits:6};
    try{return new Intl.NumberFormat('id-ID',o).format(v)}catch(e){return String(v)}
  }
  function closePop(){if(pop){pop.remove();pop=null}}
  function render(){
    closePop();
    var base=parse(txt);
    var b=isNaN(base)?NaN:toBase(sel[act],base);
    rowsEl.innerHTML='';
    sel.forEach(function(code,i){
      var u=U(code),row=document.createElement('div');row.className='un-row'+(i===act?' on':'');
      var ub=document.createElement('button');ub.type='button';ub.className='un-u';
      ub.innerHTML=u[1]+' <b>'+u[2]+'</b><i></i>';
      var inp=document.createElement('input');inp.className='un-v';inp.type='text';inp.setAttribute('inputmode','decimal');inp.setAttribute('autocomplete','off');
      inp.setAttribute('aria-label',u[1]);
      inp.value=(i===act)?txt:(isNaN(b)?'':fmt(fromBase(code,b)));
      row.appendChild(ub);row.appendChild(inp);rowsEl.appendChild(row);
      inp.addEventListener('focus',function(){
        if(act!==i){var cur=inp.value;act=i;txt=cur||'0'; render(); var n=rowsEl.querySelectorAll('.un-v')[i];if(n){n.focus();try{n.select()}catch(e){}}}
        else{try{inp.select()}catch(e){}}
      });
      inp.addEventListener('input',function(){
        txt=inp.value.replace(/[^0-9.,\-]/g,'').replace(/^(-?)0+(?=\d)/,'$1');if(inp.value!==txt)inp.value=txt;
        var nb=parse(txt);
        Array.prototype.forEach.call(rowsEl.querySelectorAll('.un-v'),function(el,k){
          if(k===i)return;
          el.value=isNaN(nb)?'':fmt(fromBase(sel[k],toBase(sel[i],nb)));
        });
      });
      row.addEventListener('click',function(e){if(e.target===row)inp.focus()});
      ub.addEventListener('click',function(e){e.stopPropagation();openPop(i,row)});
    });
    noteEl.textContent=C().t?'Rumus: C × 9/5 + 32 = F':'';
  }
  function openPop(i,row){
    var wasMine=pop&&pop._i===i;closePop();if(wasMine)return;
    var p=document.createElement('div');p.className='un-pop';p._i=i;
    C().u.forEach(function(u){
      var b=document.createElement('button');b.type='button';if(u[0]===sel[i])b.className='on';
      b.innerHTML='<span>'+(u[0]===sel[i]?'\u2713':'')+'</span>'+u[1]+'<b>'+u[2]+'</b>';
      b.addEventListener('click',function(e){
        e.stopPropagation();
        var old=sel[i];
        var dup=sel.indexOf(u[0]);
        if(dup>=0&&dup!==i){sel[dup]=old}
        sel[i]=u[0];save();render();
      });
      p.appendChild(b);
    });
    rowsEl.appendChild(p);
    var top=row.offsetTop+row.offsetHeight+4;
        p.style.top=top+'px';
    var bottom=rowsEl.getBoundingClientRect().top+top+p.offsetHeight;
    if(bottom>window.innerHeight-8){p.style.top=Math.max(0,row.offsetTop-p.offsetHeight-4)+'px'}
    pop=p;
  }
  function tabs(){
    tabsEl.innerHTML='';
    CAT.forEach(function(c,i){
      var b=document.createElement('button');b.type='button';b.className='un-tab'+(i===cat?' on':'');b.textContent=c.n;b.setAttribute('role','tab');
      b.addEventListener('click',function(){cat=i;sel=C().d.slice();act=0;txt='1';save();tabs();render()});
      tabsEl.appendChild(b);
    });
  }
  var page=document.getElementById('satuan');
  function open(){
    if(page.classList.contains('open'))return;
    valid();tabs();render();
    page.classList.add('open');page.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }
  function close(){page.classList.remove('open');page.setAttribute('aria-hidden','true');document.body.style.overflow='';closePop()}
  var btn=document.getElementById('kRuler');
  if(btn){
    btn.setAttribute('aria-label','Pengonversi satuan');
    btn.addEventListener('click',open);
  }
  document.getElementById('satuanBack').addEventListener('click',close);
  page.addEventListener('click',function(e){if(pop&&!e.target.closest('.un-pop')&&!e.target.closest('.un-u'))closePop()});
  /* Router sudah jalan lebih dulu: terapkan ulang rute setelah tombol konverter siap. */
  if(window.applyRoute){
    var pth=window.__bootPath||'';
    if(pth==='/kalkulator/mata-uang'||pth==='/kalkulator/satuan'){window.applyRoute(pth)}
  }
})();
