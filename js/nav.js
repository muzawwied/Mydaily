/* Navigasi bawah yang tegas: pindah menu tidak boleh gagal karena tumpukan overlay. */
(function(){
  var MAP={openFeed:'feed',openChat:'chat',openProf:'prof'};
  var ALL=['feed','chat','prof','keu','jam','cal','task','note'];
  function closeAll(except){
    ALL.forEach(function(k){
      if(k===except)return;
      var sec=document.getElementById(k);
      if(!sec||!sec.classList.contains('open'))return;
      var back=document.getElementById(k+'Back');
      if(back)back.click();
    });
  }
  document.querySelectorAll('.nav .nb').forEach(function(b){
    b.addEventListener('click',function(){
      var want=MAP[b.id];
      if(!want)return;
      /* Chat menumpuk di atas halaman aktif (z-index 40), bukan menggantikannya,
         supaya tombol kembali langsung menampilkan halaman asal tanpa kedip. */
      if(want!=='chat')closeAll(want);
      var guard=0;
      (function ensure(){
        var sec=document.getElementById(want);
        if(!sec||sec.classList.contains('open'))return;
        if(guard++>2)return;
        var opener=document.getElementById(b.id);
        if(opener)opener.click();
        setTimeout(ensure,60);
      })();
    },true);
  });
})();
