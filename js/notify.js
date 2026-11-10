/* Notifikasi perangkat (khusus APK). Di browser biasa blok ini tidak melakukan apa pun. */
(function(){
  var B=window.MdNotify;
  if(!B) return;
  function pad(n){return n<10?'0'+n:''+n}
  function reminders(){
    var A={};try{A=JSON.parse(localStorage.getItem('agenda'))||{}}catch(e){return []}
    var out=[];
    Object.keys(A).forEach(function(k){
      var arr=Array.isArray(A[k])?A[k]:[];
      arr.forEach(function(it,idx){
        var o=typeof it==='string'?{t:it}:it;
        if(!o||!o.t) return;
        var hm=String(o.j||'').match(/^(\d{1,2})[.:](\d{2})/);
        if(!hm) return;
        var p=k.split('-');
        if(p.length<3) return;
        var d=new Date(+p[0],+p[1]-1,+p[2],+hm[1],+hm[2],0,0);
        if(isNaN(d.getTime())) return;
        if(d.getTime()<=Date.now()+60000) return;
        out.push({
          id:'agenda|'+k+'|'+idx,
          t:String(o.t).slice(0,90),
          b:(o.c?String(o.c).slice(0,200):'Pengingat agenda pukul '+hm[1]+'.'+hm[2]),
          w:d.getTime()
        });
      });
    });
    return out;
  }
  function sync(){
    try{
      var items=reminders();
      (window.mdNotifySources||[]).forEach(function(f){
        try{var extra=f();if(Array.isArray(extra))items=items.concat(extra)}catch(e){}
      });
      B.clearAll();
      items.forEach(function(x){
        try{
          if(typeof x.days==='string' && typeof B.scheduleAlarm==='function'){
            B.scheduleAlarm(x.id,x.t,x.b,x.w,x.days);
          }else{
            B.schedule(x.id,x.t,x.b,x.w);
          }
        }catch(e){}
      });
      pushWidget(items);
    }catch(e){}
  }
  function pushWidget(items){
    if(typeof B.setWidget!=='function') return;
    try{
      var next=null;
      items.forEach(function(x){
        if(x && typeof x.id==='string' && x.id.indexOf('alarm|')===0 && (next===null || x.w<next.w)) next=x;
      });
      var T=[];try{var raw=JSON.parse(localStorage.getItem('tugas'));T=Array.isArray(raw)?raw:[]}catch(e){}
      var sisa=T.filter(function(x){return x&&!x.d}).length;
      var alarmText=next?('Alarm '+(next.b||'').replace(/^Alarm\s*/,'').replace(/^pukul\s*/,'pukul ')):'Belum ada alarm';
      var taskText=sisa===0?'Semua tugas beres':(sisa+' tugas belum selesai');
      if(typeof B.setWidgetEx==='function'){
        var done=T.filter(function(x){return x&&x.d}).length;
        var dd=new Date();
        var DN2=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
        var tgl=DN2[dd.getDay()]+', '+(dd.getMonth()+1)+'/'+dd.getDate();
        B.setWidgetEx(tgl,alarmText,done,T.length);
      }else{
        B.setWidget(alarmText,taskText);
      }
    }catch(e){}
  }
  window.mdSyncReminders=sync;
  try{
    var si=localStorage.setItem.bind(localStorage);
    localStorage.setItem=function(k,v){
      si(k,v);
      if(k==='agenda') setTimeout(sync,60);
    };
  }catch(e){}
  sync();
  setInterval(sync,120000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden) sync()});
  window.addEventListener('online',sync);
  var list=document.getElementById('chatList');
  if(list&&window.MutationObserver){
    new MutationObserver(function(muts){
      if(!document.hidden) return;
      muts.forEach(function(m){
        Array.prototype.forEach.call(m.addedNodes,function(n){
          if(!n||n.nodeType!==1||!n.classList) return;
          if(!n.classList.contains('cm')||!n.classList.contains('a')||n.classList.contains('dots')) return;
          var txt=(n.textContent||'').trim();
          if(!txt) return;
          try{B.notify('Clara',txt.slice(0,200))}catch(e){}
        });
      });
    }).observe(list,{childList:true});
  }
})();
