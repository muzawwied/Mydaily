/* Perbaikan area aman di WebView/APK Android. */
/* Di WebView/APK lama env(safe-area-inset-top) bisa 0, padahal layar Android 15
   menggambar sampai ke kamera punch-hole. Isi --sat dengan tinggi aman. */
(function(){
  try{
    var probe=document.createElement('div');
    probe.style.cssText='position:fixed;top:0;left:0;width:0;height:0;padding-top:env(safe-area-inset-top,0px)';
    document.documentElement.appendChild(probe);
    var envTop=parseFloat(getComputedStyle(probe).paddingTop)||0;
    probe.remove();
    var ua=navigator.userAgent||'';
    var inShell=/RakitWebApp|; wv\)/i.test(ua)||window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    if(envTop<1&&inShell){
      var fallback=(window.__mdSafeTop||0)||30; /* status bar + kamera */
      document.documentElement.style.setProperty('--sat',fallback+'px');
    }
  }catch(e){}
})();
