/* Keuangan: catatan pemasukan & pengeluaran. Data disimpan di perangkat. */
(function(){
  var KEY='keuangan';
  var $=function(i){return document.getElementById(i)};
  var sec=$('keu'),km=$('kModal');
  if(!sec||!km)return;
  var listEl=$('kList'),emp=$('kEmpty');
  var sEl=$('kSaldo'),inEl=$('kIn'),outEl=$('kOut'),tabs=$('kTabs');
  var inp=$('kInp'),amt=$('kAmount'),dt=$('kDate'),kind=$('kKind');
  var saveBtn=$('kSave'),mt=$('kMt');
  var tEl=$('kToast'),tMsg=$('kMsg'),tUndo=$('kUndo');
  var K=[],filt='all',editId=null,undoItem=null,tmr=null,jenis='out';
  try{var raw=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(raw))K=raw.filter(function(x){return x&&typeof x.t==='string'&&!isNaN(+x.n)})}catch(e){K=[]}
  var MN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  function uid(){return (Math.random().toString(36)+'000000').slice(2,9)}
  function pad(n){return n<10?'0'+n:''+n}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(K))}catch(e){}}
  function rp(n){var v=Math.round(+n||0);return (v<0?'-':'')+'Rp'+Math.abs(v).toLocaleString('id-ID')}
  function todayStr(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function gl(s){
    var t=todayStr();
    if(s===t)return 'Hari ini';
    var d=new Date();d.setDate(d.getDate()-1);
    var y=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    if(s===y)return 'Kemarin';
    return fd(s)||'Tanpa tanggal';
  }
  function fd(s){var p=String(s||'').split('-');if(p.length<3)return '';var b=MN[+p[1]-1];return b?(+p[2])+' '+b+' '+p[0]:''}
  function toast(msg,undo){
    tMsg.textContent=msg;tUndo.hidden=!undo;
    tUndo.onclick=undo?function(){undo();hideToast()}:null;
    tEl.hidden=false;clearTimeout(tmr);tmr=setTimeout(hideToast,5000);
  }
  function hideToast(){tEl.hidden=true;clearTimeout(tmr)}
  function render(){
    var tin=0,tout=0;
    K.forEach(function(x){if(x.k==='in')tin+=+x.n;else tout+=+x.n});
    sEl.textContent=rp(tin-tout);inEl.textContent=rp(tin);outEl.textContent=rp(tout);
    Array.prototype.forEach.call(tabs.children,function(b){b.className=b.dataset.f===filt?'on':''});
    listEl.innerHTML='';
    var grup=null,grupLab='',box=null;
    K.slice().sort(function(a,b){
      var da=String(a.d||''),db=String(b.d||'');
      if(da!==db)return da<db?1:-1;
      return (+b.c||0)-(+a.c||0);
    }).forEach(function(x){
      if(filt!=='all'&&x.k!==filt)return;
      var lab=gl(x.d);
      if(lab!==grupLab){
        grupLab=lab;
        grup=document.createElement('div');grup.className='kgrp';grup.textContent=lab;
        listEl.appendChild(grup);
        box=document.createElement('div');box.className='kgp';
        listEl.appendChild(box);
      }
      var r=document.createElement('div');r.className='krow';r.dataset.id=x.id;
      var ic=document.createElement('div');ic.className='kic '+x.k;ic.innerHTML=x.k==='in'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7L7 17M15 17H7V9"/></svg>';r.appendChild(ic);
      var b=document.createElement('div');b.className='kb';
      var t=document.createElement('div');t.className='kt';t.textContent=x.t;b.appendChild(t);
      r.appendChild(b);
      var n=document.createElement('div');n.className='kn '+x.k;n.textContent=(x.k==='in'?'+':'\u2212')+rp(x.n);r.appendChild(n);
      r.addEventListener('click',function(){openRow(x)});
      box.appendChild(r);
    });
    emp.hidden=listEl.children.length>0;
  }
  function openRow(x){
    window.sheet(x.t,[
      {l:'Ubah',i:'edit',f:function(){openEditor(x)}},
      {l:'Hapus',i:'del',d:1,f:function(){hapus(x)}}
    ]);
  }
  function hapus(x){
    var idx=K.indexOf(x);if(idx<0)return;
    K.splice(idx,1);save();render();
    toast('Transaksi dihapus',function(){
      K.splice(idx,0,x);save();render();
    });
  }
  function setJenis(v){
    jenis=v;
    Array.prototype.forEach.call(kind.children,function(b){b.className=b.dataset.k===v?'on':''});
  }
  function chk(){
    var ok=inp.value.trim().length>0 && +amt.value>0;
    saveBtn.disabled=!ok;
  }
  function openEditor(item){
    editId=item?item.id:null;
    mt.textContent=item?'Ubah transaksi':'Catat transaksi';
    inp.value=item?item.t:'';
    amt.value=item?String(item.n):'';
    dt.value=item&&item.d?item.d:todayStr();
    setJenis(item?(item.k==='in'?'in':'out'):'out');
    chk();
    km.hidden=false;document.body.classList.add('km-open');
    if(!item)setTimeout(function(){try{inp.focus()}catch(e){}},120);
  }
  function closeEditor(){
    km.hidden=true;document.body.classList.remove('km-open');
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  }
  function simpan(){
    var t=inp.value.trim(),n=Math.round(+amt.value||0);
    if(!t||n<=0)return;
    var d=dt.value||todayStr();
    if(editId){
      var it=null;
      for(var i=0;i<K.length;i++)if(K[i].id===editId){it=K[i];break}
      if(it){it.t=t;it.n=n;it.k=jenis;it.d=d}
    }else{
      K.push({id:uid(),t:t,n:n,k:jenis,d:d,c:Date.now()});
    }
    save();render();closeEditor();
    hideToast();
    toast(editId?'Transaksi diperbarui':'Transaksi tersimpan');
    editId=null;
  }
  $('openKeu').addEventListener('click',function(){
    if(!sec.classList.contains('open')){
      ['feed','chat','prof','cal','task','note'].forEach(function(k){
        var el=document.getElementById(k);
        if(!el||!el.classList.contains('open'))return;
        var back=document.getElementById(k+'Back');
        if(back)back.click();
      });
      render();
      sec.classList.add('open');
      sec.setAttribute('aria-hidden','false');
      sec.scrollTop=0;
      document.body.style.overflow='hidden';
      document.body.classList.add('keu-open');
    }
  });
  $('keuBack').addEventListener('click',function(){
    if(!km.hidden)closeEditor();
    sec.classList.remove('open');
    sec.setAttribute('aria-hidden','true');
    document.body.classList.remove('keu-open');
    document.body.style.overflow='';
    hideToast();
    var nb=document.querySelectorAll('.nav .nb');
    Array.prototype.forEach.call(nb,function(x){x.classList.remove('on')});
    if(nb[0])nb[0].classList.add('on');
  });
  $('addKeu').addEventListener('click',function(){openEditor(null)});
  $('kNo').addEventListener('click',closeEditor);
  $('kSave').addEventListener('click',function(e){e.preventDefault();simpan()});
  $('kForm').addEventListener('submit',function(e){e.preventDefault();simpan()});
  inp.addEventListener('input',chk);
  amt.addEventListener('input',chk);
  Array.prototype.forEach.call(kind.children,function(b){
    b.addEventListener('click',function(){setJenis(b.dataset.k);});
  });
  Array.prototype.forEach.call(tabs.children,function(b){
    b.addEventListener('click',function(){filt=b.dataset.f;render()});
  });
  $('keuMenu').addEventListener('click',function(){
    window.sheet('',[
      {l:'Hapus semua transaksi',i:'del',d:1,f:function(){
        if(!K.length)return;
        var bak=K.slice();
        K=[];save();render();
        toast('Semua transaksi dihapus',function(){K=bak;save();render()});
      }}
    ]);
  });
  render();
})();
