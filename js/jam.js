/* Jam: jam sekarang, alarm, hitung mundur, dan stopwatch. */
(function(){
  var KEY='jam_alarm';
  var $=function(i){return document.getElementById(i)};
  var sec=$('jam');if(!sec)return;
  var A=[];
  try{var raw=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(raw))A=raw.filter(function(x){return x&&/^\d{1,2}:\d{2}$/.test(String(x.t))})}catch(e){A=[]}
  var DN=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var MN=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var ac=null,ringTimer=null,lastFire='',ringVib=true;
  function pad(n){return n<10?'0'+n:''+n}
  function saveA(){try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}}
  function toast(m,undo){
    var t=$('jToast');$('jMsg').textContent=m;
    var b=$('jUndo');
    if(b){b.hidden=!undo;b.onclick=undo?function(){undo();t.hidden=true}:null}
    t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(function(){t.hidden=true},4200);
  }
  function beep(times){
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      ac=ac||new C();if(ac.state==='suspended')ac.resume();
      for(var i=0;i<times;i++){
        var t0=ac.currentTime+i*0.42;
        var o=ac.createOscillator(),g=ac.createGain();
        o.type='sine';o.frequency.setValueAtTime(880,t0);
        g.gain.setValueAtTime(0.0001,t0);
        g.gain.exponentialRampToValueAtTime(0.22,t0+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,t0+0.3);
        o.connect(g);g.connect(ac.destination);o.start(t0);o.stop(t0+0.32);
      }
    }catch(e){}
  }
  function ring(title,sub){
    $('jRingT').textContent=title;$('jRingS').textContent=sub;$('jRing').hidden=false;
    beep(3);
    try{if(ringVib&&navigator.vibrate)navigator.vibrate([220,120,220])}catch(e){}
    clearInterval(ringTimer);
    ringTimer=setInterval(function(){
      if($('jRing').hidden){clearInterval(ringTimer);return}
      beep(2);
    },2600);
  }
  $('jRingStop').addEventListener('click',function(){$('jRing').hidden=true;clearInterval(ringTimer)});
  // ---- panel
  var tabs=$('jTabs');
  var PTITLE={clock:'Jam',alarm:'Alarm',timer:'Timer',stopwatch:'Stopwatch'};
  function setPanel(p){
    sec.dataset.panel=p;
    var tt=$('jamTitle');
    if(tt)tt.textContent=PTITLE[p]||'Jam';
    if(sec.classList.contains('open'))document.title=(PTITLE[p]||'Jam')+' \u00b7 My Daily';
    Array.prototype.forEach.call(tabs.children,function(b){b.className=b.dataset.p===p?'on':''});
    Array.prototype.forEach.call(sec.querySelectorAll('.jpanel'),function(el){el.hidden=el.dataset.p!==p});
    if(p==='clock')tickClock();
    if(p==='timer')setTimeout(function(){setWheel(tPick);if(!tRun)tArm(tPick)},0);
  }
  Array.prototype.forEach.call(tabs.children,function(b){b.addEventListener('click',function(){setPanel(b.dataset.p)})});
  // ---- alarm
  var DAYN=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  function alarmDays(a){return Array.isArray(a.days)?a.days.filter(function(x){return x>=0&&x<=6}):[]}
  function daysLabel(a){
    var d=alarmDays(a);
    if(!d.length||d.length>=7)return 'Setiap hari';
    return d.slice().sort().map(function(x){return DAYN[x]}).join(', ');
  }
  function nextAt(a){
    var p=String(a.t).split(':'),h=+p[0],m=+p[1];
    if(isNaN(h)||isNaN(m))return 0;
    var days=alarmDays(a);
    var d=new Date();d.setHours(h,m,0,0);
    if(d.getTime()<=Date.now())d.setDate(d.getDate()+1);
    if(days.length&&days.length<7){
      var guard=0;
      while(days.indexOf(d.getDay())<0&&guard++<8)d.setDate(d.getDate()+1);
    }
    return d.getTime();
  }
    function findA(id){
    for(var i=0;i<A.length;i++)if(A[i].id===id)return A[i];
    return null;
  }
  function renderA(){
    var list=$('jAlarmList');list.innerHTML='';
    A.slice().sort(function(a,b){
      if(!!b.on!==!!a.on)return b.on?1:-1;
      return String(a.t).localeCompare(String(b.t));
    }).forEach(function(a){
      var row=document.createElement('div');row.className='jrow'+(a.on?'':' mati');row.dataset.id=a.id;
      var tm=document.createElement('div');tm.className='jrow-t';tm.textContent=String(a.t).replace(':','.');row.appendChild(tm);
      var b=document.createElement('div');b.style.minWidth='0';
      var lb=document.createElement('div');lb.className='kt';lb.textContent=a.l||'Alarm';b.appendChild(lb);
      var st=document.createElement('div');st.className='km2';st.textContent=daysLabel(a);b.appendChild(st);
      row.appendChild(b);
      var sw=document.createElement('button');sw.type='button';sw.className='jsw'+(a.on?' on':'');sw.dataset.sw='1';
      sw.setAttribute('aria-label',a.on?'Matikan alarm':'Aktifkan alarm');
      row.appendChild(sw);
      list.appendChild(row);
    });
    if(!A.length){
      var dm=document.createElement('div');dm.className='jrow mati demo';dm.dataset.demo='1';
      var dt=document.createElement('div');dt.className='jrow-t';dt.textContent='07.00';dm.appendChild(dt);
      var db=document.createElement('div');db.style.minWidth='0';
      var dl=document.createElement('div');dl.className='kt';dl.textContent='Alarm baru';db.appendChild(dl);
      var ds=document.createElement('div');ds.className='km2';ds.textContent='Atur waktu sesuai kebutuhan';db.appendChild(ds);
      dm.appendChild(db);
      var dsw=document.createElement('button');dsw.type='button';dsw.className='jsw';dsw.setAttribute('aria-label','Buat alarm baru');
      dm.appendChild(dsw);
      list.appendChild(dm);
    }
    $('jAlarmEmpty').hidden=true;
    updateNext();
  }
  $('jAlarmList').addEventListener('click',function(e){
    var row=e.target.closest?e.target.closest('.jrow'):null;
    if(!row)return;
    if(row.dataset.demo){
      openForm(null);setTime('07:00');
      return;
    }
    var a=findA(row.dataset.id);
    if(!a)return;
    if(e.target.closest('.jsw')){
      a.on=!a.on;
      saveA();renderA();syncNotif();
      toast(a.on?'Alarm diaktifkan':'Alarm dimatikan');
      return;
    }
    window.sheet(String(a.t).replace(':','.')+(a.l?' \u00b7 '+a.l:''),[
      {l:'Ubah alarm',i:'edit',f:function(){openForm(a)}},
      {l:'Hapus alarm',i:'del',d:1,f:function(){
        var i=A.indexOf(a);if(i<0)return;
        var bak=a;A.splice(i,1);
        saveA();renderA();syncNotif();
        toast('Alarm dihapus',function(){A.splice(Math.min(i,A.length),0,bak);saveA();renderA();syncNotif()});
      }}
    ]);
  });
function updateNext(){
    var on=A.filter(function(a){return a.on});
    var el=$('jNext');
    if(!on.length){el.hidden=true;return}
    var best=null,bestT=0;
    on.forEach(function(a){var t=nextAt(a);if(!bestT||t<bestT){bestT=t;best=a}});
    if(!best){el.hidden=true;return}
    var d=new Date(bestT);
    el.hidden=false;
    el.textContent='Alarm berikutnya '+(best.l?best.l+' \u00b7 ':'')+pad(d.getHours())+'.'+pad(d.getMinutes())+(d.getDate()!==new Date().getDate()?' besok':'');
  }
  var ja=$('jAModal'),jaTime=$('jaTime'),jaName=$('jaName'),jaDays=$('jaDays'),jaVib=$('jaVib'),jaSave=$('jaSave'),jaTitle=$('jaTitle'),jaPrev=$('jaPrev');
  var editA=null,daysSel=[],formTime='';
  function paintDays(){
    Array.prototype.forEach.call(jaDays.children,function(b){
      var d=b.dataset.d;
      b.className=d==='all'?(daysSel.length?'':'on'):(daysSel.indexOf(+d)>=0?'on':'');
    });
    jaSave.disabled=!/^\d{2}:\d{2}$/.test(formTime);
    previewA();
  }
  function previewA(){
    if(!/^\d{2}:\d{2}$/.test(formTime)){jaPrev.textContent='Pilih jam dulu';return}
    var d=new Date(nextAt({t:formTime,days:daysSel.slice()}));
    var now=new Date();
    var same=d.toDateString()===now.toDateString();
    var msg='Berbunyi '+(same?'hari ini':DN[d.getDay()]+', '+d.getDate()+' '+MN[d.getMonth()]);
    msg+=' pukul '+pad(d.getHours())+'.'+pad(d.getMinutes())+' \u00b7 ';
    msg+=(daysSel.length?daysSel.slice().sort().map(function(x){return DAYN[x]}).join(', '):'setiap hari');
    jaPrev.textContent=msg;
  }
  jaDays.addEventListener('click',function(e){
    var b=e.target.closest?e.target.closest('button'):null;
    if(!b||!jaDays.contains(b))return;
    var d=b.dataset.d;
    if(d==='all'){daysSel=[]}
    else{
      var n=+d,i=daysSel.indexOf(n);
      if(i>=0)daysSel.splice(i,1);else daysSel.push(n);
      if(daysSel.length>=7)daysSel=[];
    }
    paintDays();
  });
  function setTime(v){
    formTime=/^\d{2}:\d{2}$/.test(v)?v:'';
    var el=$('jaTimeV'),btn=$('jaTime');
    el.textContent=formTime?formTime:'--:--';
    btn.className='jabig'+(formTime?'':' blank');
    paintDays();
  }
  var jp=$('jPick'),jpH=$('jPickH'),jPM=$('jPickM'),jpPre=$('jPickPre');
  var selH=7,selM=0;
  function buildPick(){
    if(jpH.children.length)return;
    for(var h=0;h<24;h++){
      (function(v){
        var b=document.createElement('button');b.type='button';b.dataset.v=v;b.textContent=pad(v);
        b.addEventListener('click',function(){selH=v;paintPick()});
        jpH.appendChild(b);
      })(h);
    }
    for(var m=0;m<60;m++){
      (function(v){
        var b=document.createElement('button');b.type='button';b.dataset.v=v;b.textContent=pad(v);
        b.addEventListener('click',function(){selM=v;paintPick()});
        jPM.appendChild(b);
      })(m);
    }
  }
  function paintPick(){
    Array.prototype.forEach.call(jpH.children,function(b){b.className=+b.dataset.v===selH?'on':''});
    Array.prototype.forEach.call(jPM.children,function(b){b.className=+b.dataset.v===selM?'on':''});
    jpPre.textContent=pad(selH)+':'+pad(selM);
  }
  function centerPick(){
    var hb=jpH.querySelector('[data-v="'+selH+'"]'),mb=jPM.querySelector('[data-v="'+selM+'"]');
    if(hb)jpH.scrollTop=hb.offsetTop-(jpH.clientHeight-44)/2;
    if(mb)jPM.scrollTop=mb.offsetTop-(jPM.clientHeight-44)/2;
  }
  function openPick(){
    buildPick();
    var p=(formTime||'07:00').split(':');
    selH=+p[0];selM=+p[1];
    paintPick();
    jp.hidden=false;
    setTimeout(centerPick,40);
  }
  function closePick(){jp.hidden=true}
  $('jaTime').addEventListener('click',openPick);
  $('jPickNo').addEventListener('click',closePick);
  $('jPickOk').addEventListener('click',function(){setTime(pad(selH)+':'+pad(selM));closePick()});
  jp.addEventListener('click',function(e){if(e.target===jp)closePick()});
  jaVib.addEventListener('click',function(){jaVib.classList.toggle('on')});
  function openForm(item){
    editA=item||null;
    jaTitle.textContent=item?'Ubah alarm':'Alarm baru';
    setTime(item?String(item.t):'');
    jaName.value=item?(item.l||''):'';
    daysSel=item?alarmDays(item).slice():[];
    jaVib.classList.toggle('on',item?(item.v!==false):true);
    paintDays();
    ja.hidden=false;document.body.classList.add('ja-open');
    if(!item)setTimeout(function(){try{$('jaTime').focus()}catch(e){}},120);
  }
  function closeForm(){
    ja.hidden=true;document.body.classList.remove('ja-open');
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  }
  function saveForm(){
    var t=formTime;
    if(!/^\d{2}:\d{2}$/.test(t)){toast('Pilih jam alarm dulu');return}
    var l=jaName.value.trim().slice(0,30);
    var vib=jaVib.classList.contains('on');
    var days=daysSel.slice().sort();
    if(editA){
      editA.t=t;editA.l=l;editA.days=days;editA.v=vib;
    }else{
      A.push({id:(Math.random().toString(36)+'000000').slice(2,9),t:t,l:l,on:true,days:days,v:vib});
    }
    saveA();renderA();syncNotif();closeForm();
    toast((editA?'Alarm diperbarui':'Alarm '+t.replace(':','.')+' disiapkan'));
    editA=null;
  }
  $('jaNo').addEventListener('click',closeForm);
  $('jaSave').addEventListener('click',function(e){e.preventDefault();saveForm()});
  $('jaForm').addEventListener('submit',function(e){e.preventDefault();saveForm()});
  $('jamAdd').addEventListener('click',function(){setPanel('alarm');openForm(null)});
  function beepCtxInit(){try{var C=window.AudioContext||window.webkitAudioContext;if(C&&!ac)ac=new C();if(ac&&ac.state==='suspended')ac.resume()}catch(e){}}
  // sumber notifikasi untuk APK
  window.mdNotifySources=window.mdNotifySources||[];
  window.mdNotifySources.push(function(){
    return A.filter(function(a){return a.on}).map(function(a){
      var p=String(a.t).split(':'),h=+p[0],m=+p[1];
      return {id:'alarm|'+a.id,t:'Alarm',b:(a.l||'Alarm')+' pukul '+pad(h)+'.'+pad(m),w:nextAt(a),days:alarmDays(a).join(',')};
    });
  });
  function syncNotif(){try{if(window.mdSyncReminders)window.mdSyncReminders()}catch(e){}}
  // ---- jam berjalan + cek alarm
  var lastMin='';
  function tickClock(){
    var d=new Date();
    var hh=pad(d.getHours()),mm=pad(d.getMinutes()),ss=d.getSeconds();
    var hEl=$('jH'),mEl=$('jM');
    if(hEl&&hEl.textContent!==hh)hEl.textContent=hh;
    if(mEl&&mEl.textContent!==mm){
      mEl.textContent=mm;
      if(lastMin)popDigits();
      lastMin=mm;
    }
    var st=$('jSecTxt');
    if(st)st.textContent=pad(ss)+' detik';
    var dt=$('jDate');
    if(dt)dt.textContent=DN[d.getDay()]+', '+d.getDate()+' '+MN[d.getMonth()]+' '+d.getFullYear();
    var arc=$('jArc');
    if(arc){
      var C=2*Math.PI*88;
      arc.style.strokeDasharray=C.toFixed(1);
      arc.style.strokeDashoffset=(C*(1-(ss+d.getMilliseconds()/1000)/60)).toFixed(1);
    }
    var key=pad(d.getHours())+':'+pad(d.getMinutes());
    if(d.getSeconds()===0){
      A.forEach(function(a){
        if(!a.on||a.t!==key)return;
        var dl=alarmDays(a);
        if(dl.length&&dl.length<7&&dl.indexOf(d.getDay())<0)return;
        var tag=a.id+'|'+new Date().toDateString()+'|'+key;
        if(lastFire===tag)return;
        lastFire=tag;
        ringVib=a.v!==false;
        ring('Alarm',(a.l?a.l+' \u00b7 ':'')+key.replace(':','.'));
      });
    }
    updateNext();
  }
  // ---- hitung mundur
  var tEnd=0,tLeftMs=0,tTotal=0,tRun=false,tInt=null,tPick=300;
  var BELL_KEY='timer_bell',bellOn=true;
  try{bellOn=localStorage.getItem(BELL_KEY)!=='0'}catch(e){}
  function W(u){return document.querySelector('.jwheel[data-u="'+u+'"]')}
  function tShow(ms){
    ms=Math.max(0,ms);
    var s=Math.ceil(ms/1000);
    var big=$('jTimer');
    if(big)big.textContent=s>=3600?(Math.floor(s/3600)+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60)):(pad(Math.floor(s/60))+':'+pad(s%60));
    var arc=$('jTimerArc');
    if(arc){
      var C=2*Math.PI*88;
      arc.style.strokeDasharray=C.toFixed(1);
      var ratio=tTotal>0?Math.min(1,ms/tTotal):0;
      arc.style.strokeDashoffset=(C*(1-ratio)).toFixed(1);
    }
    var st=$('jTimerState');
    if(st)st.textContent=ms<=0?(tTotal?'Selesai':'Siap dimulai'):(tRun?'Berjalan':'Dijeda');
    var rs=$('jTimerReset');
    if(rs)rs.disabled=!(ms>0||tTotal>0);
  }
  function tView(run){
    var tp=$('jTp'),dl=$('jRun');
    if(tp)tp.hidden=!!run;
    if(dl)dl.hidden=!run;
  }
  function tStop(){
    tRun=false;clearInterval(tInt);tInt=null;
    $('jTimerToggle').textContent='Lanjut';
  }
  function tArm(sec){
    tRun=false;clearInterval(tInt);tInt=null;tTotal=0;
    tLeftMs=Math.max(0,sec)*1000;
    $('jTimerToggle').textContent='Mulai';
    tView(false);tShow(0);
    var st=$('jTimerState');
    if(st)st.textContent=tLeftMs>0?'Siap dimulai':'Atur waktu';
    var rs=$('jTimerReset');
    if(rs)rs.disabled=tLeftMs<=0;
  }
  function tStart(){
    if(tLeftMs<=0)tLeftMs=wheelSec()*1000;
    if(tLeftMs<=0){toast('Atur waktu dulu');return}
    beepCtxInit();
    tRun=true;tEnd=Date.now()+tLeftMs;tTotal=tTotal||tLeftMs;
    $('jTimerToggle').textContent='Jeda';
    tView(true);tShow(tLeftMs);
    clearInterval(tInt);
    tInt=setInterval(function(){
      var left=tEnd-Date.now();
      if(left<=0){
        tLeftMs=0;tShow(0);tStop();
        $('jTimerToggle').textContent='Mulai';
        if(bellOn)ring('Timer selesai','Waktunya habis');
        return;
      }
      tLeftMs=left;tShow(left);
    },200);
  }
  function buildWheel(el,max){
    if(!el)return;
    el.innerHTML='';
    for(var v=0;v<max;v++){
      var b=document.createElement('button');
      b.type='button';b.textContent=pad(v);b.dataset.v=v;
      el.appendChild(b);
    }
  }
  function wheelIdx(el){
    if(!el)return 0;
    return Math.max(0,Math.min(el.children.length-1,Math.round(el.scrollTop/58)));
  }
  function wheelSec(){
    return wheelIdx(W('h'))*3600+wheelIdx(W('m'))*60+wheelIdx(W('s'));
  }
  function setWheel(sec){
    tPick=sec;
    var vals=[Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60],us=['h','m','s'];
    us.forEach(function(u,i){
      var el=W(u);
      if(!el)return;
      var v=Math.min(vals[i],el.children.length-1);
      el.scrollTop=v*58;
      Array.prototype.forEach.call(el.children,function(c,ix){c.classList.toggle('on',ix===v)});
    });
  }
  ['h','m','s'].forEach(function(u,i){
    var el=W(u);
    if(!el)return;
    buildWheel(el,i===0?24:60);
    var tm=null;
    el.addEventListener('scroll',function(){
      clearTimeout(tm);
      tm=setTimeout(function(){
        var ix=wheelIdx(el);
        Array.prototype.forEach.call(el.children,function(c,k){c.classList.toggle('on',k===ix)});
        tPick=wheelSec();
        if(!tRun)tArm(tPick);
      },120);
    });
  });
  $('jTimerToggle').addEventListener('click',function(){tRun?tStop():tStart()});
  $('jTimerReset').addEventListener('click',function(){
    if(tRun)tStop();
    tTotal=0;tLeftMs=0;
    $('jTimerToggle').textContent='Mulai';
    setWheel(0);tView(false);tShow(0);
  });
  var bellBtn=$('jTimerBell');
  function paintBell(){if(bellBtn)bellBtn.classList.toggle('off',!bellOn)}
  if(bellBtn)bellBtn.addEventListener('click',function(){
    bellOn=!bellOn;
    try{localStorage.setItem(BELL_KEY,bellOn?'1':'0')}catch(e){}
    paintBell();toast(bellOn?'Suara aktif':'Suara dimatikan');
  });
  setWheel(300);
  tArm(300);
  paintBell();
  // ---- stopwatch
  var swAcc=0,swStart=0,swRun=false,swInt=null,laps=[];
  function swVal(){return swAcc+(swRun?Date.now()-swStart:0)}
  function swShow(){
    var rs=$('jSwReset');if(rs)rs.disabled=swRun;
    var v=swVal(),m=Math.floor(v/60000),sec=Math.floor(v/1000)%60,ds=Math.floor(v%1000/100);
    $('jSw').textContent=pad(m)+':'+pad(sec);
    var ms=$('jSwMs');
    if(ms)ms.textContent='.'+ds;
    var arc=$('jSwArc');
    if(arc){
      var C=2*Math.PI*88;
      arc.style.strokeDasharray=C.toFixed(1);
      arc.style.strokeDashoffset=(C*(1-(v%60000)/60000)).toFixed(1);
    }
    var st=$('jSwState');
    if(st)st.textContent=v<=0?'Siap':(swRun?'Berjalan':'Jeda');
  }
  function swStop(){swAcc=swVal();swRun=false;clearInterval(swInt);swInt=null;$('jSwToggle').textContent='Mulai';var rs=$('jSwReset');if(rs)rs.disabled=false}
  function swGo(){swRun=true;swStart=Date.now();$('jSwToggle').textContent='Jeda';var rs=$('jSwReset');if(rs)rs.disabled=true;clearInterval(swInt);swInt=setInterval(swShow,100)}
  $('jSwToggle').addEventListener('click',function(){swRun?swStop():swGo()});
  $('jSwReset').addEventListener('click',function(){
    if(swRun){toast('Jeda stopwatch dulu untuk reset');return}
    swRun=false;swAcc=0;clearInterval(swInt);swInt=null;
    $('jSwToggle').textContent='Mulai';laps=[];$('jLaps').innerHTML='';swShow();
  });
  $('jSwLap').addEventListener('click',function(){
    if(!swVal())return;
    laps.unshift(swVal());
    var box=$('jLaps');box.innerHTML='';
    laps.slice(0,30).forEach(function(v,i){
      var prev=i<laps.length-1?laps[i+1]:0;
      var d=document.createElement('div');d.className='jlap';
      var n=document.createElement('b');n.textContent=String(laps.length-i);
      var t=document.createElement('span');t.className='t';
      var m=Math.floor(v/60000),sec=Math.floor(v/1000)%60,ds=Math.floor(v%1000/100);
      t.textContent=pad(m)+':'+pad(sec)+'.'+ds;
      var dl=document.createElement('span');dl.className='d';
      var delta=v-prev,dm=Math.floor(delta/60000),dsec=Math.floor(delta/1000)%60;
      dl.textContent='+'+(dm?dm+'m ':'')+(dsec%60)+'s';
      d.appendChild(n);d.appendChild(t);d.appendChild(dl);box.appendChild(d);
    });
  });
  // ---- buka / tutup halaman
  $('openJam').addEventListener('click',function(){
    if(sec.classList.contains('open'))return;
    ['keu','feed','chat','prof','cal','task','note'].forEach(function(k){
      var el=document.getElementById(k);
      if(!el||!el.classList.contains('open'))return;
      var back=document.getElementById(k+'Back');
      if(back)back.click();
    });
    renderA();tickClock();setPanel('clock');
    sec.classList.add('open');sec.setAttribute('aria-hidden','false');sec.scrollTop=0;
    document.body.style.overflow='hidden';document.body.classList.add('jam-open');
    beepCtxInit();syncNotif();
  });
  $('jamBack').addEventListener('click',function(){
    $('jRing').hidden=true;clearInterval(ringTimer);
    sec.classList.remove('open');sec.setAttribute('aria-hidden','true');
    document.body.classList.remove('jam-open');document.body.style.overflow='';
    $('jToast').hidden=true;
    swStop();
    var nb=document.querySelectorAll('.nav .nb');
    Array.prototype.forEach.call(nb,function(x){x.classList.remove('on')});
    if(nb[0])nb[0].classList.add('on');
  });
  $('jamMenu').addEventListener('click',function(){
    window.popMenu(this,[
      {l:'Alarm baru',f:function(){setPanel('alarm');openForm(null)}},
      {l:'Hentikan hitung mundur',f:function(){tStop();tTotal=0;tLeftMs=0;tShow(0);tView(false);$('jTimerToggle').textContent='Mulai'}},
      {l:'Reset stopwatch',f:function(){swRun=false;swAcc=0;clearInterval(swInt);swInt=null;$('jSwToggle').textContent='Mulai';laps=[];$('jLaps').innerHTML='';swShow()}},
      {l:'Hapus semua alarm',d:1,f:function(){
        if(!A.length)return;
        A=[];saveA();renderA();syncNotif();
        toast('Semua alarm dihapus');
      }}
    ]);
  });
  function setTimeTotal(){tTotal=0}
  function popDigits(){
    var el=$('jDigits');
    if(!el)return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    setTimeout(function(){el.classList.remove('pop')},480);
  }
  // kemiringan 3D mengikuti sentuhan / kursor
  (function(){
    var stage=sec.querySelector('.jstage');
    var face=sec.querySelector('.jface');
    if(!stage||!face)return;
    function tilt(e){
      var r=stage.getBoundingClientRect();
      var pt=(e.touches&&e.touches[0])?e.touches[0]:e;
      if(!pt)return;
      var dx=(pt.clientX-r.left)/r.width-0.5;
      var dy=(pt.clientY-r.top)/r.height-0.5;
      face.style.transition='transform .08s linear';
      face.style.transform='rotateX('+(9-dy*13).toFixed(2)+'deg) rotateY('+(dx*15).toFixed(2)+'deg)';
    }
    function rest(){
      face.style.transition='transform .5s cubic-bezier(.2,.8,.2,1)';
      face.style.transform='rotateX(10deg) rotateY(0deg)';
    }
    stage.addEventListener('pointermove',tilt);
    stage.addEventListener('pointerdown',tilt);
    stage.addEventListener('pointerleave',rest);
    stage.addEventListener('pointerup',rest);
    rest();
  })();
  renderA();tickClock();tShow(0);swShow();
  setInterval(tickClock,1000);
})();
