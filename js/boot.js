/* Penanda boot awal: mencegah kedip tema sebelum CSS dimuat. */
document.documentElement.className+=" rboot";window.addEventListener("error",function(){document.documentElement.classList.remove("rboot")});setTimeout(function(){document.documentElement.classList.remove("rboot")},700);
/* DEBUG SEMENTARA */
window.addEventListener('error',function(e){try{var g=document.getElementById('greet');var m='ERR: '+e.message+' @'+String(e.filename||'').split('/').pop()+':'+e.lineno;if(g)g.textContent=m;document.title=m}catch(x){}});
window.addEventListener('unhandledrejection',function(e){try{var g=document.getElementById('greet');var m='REJ: '+(e.reason&&e.reason.message||e.reason);if(g)g.textContent=m;document.title=m}catch(x){}});
