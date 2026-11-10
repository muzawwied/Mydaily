/* Penanda boot awal: mencegah kedip tema sebelum CSS dimuat. */
document.documentElement.className+=" rboot";window.addEventListener("error",function(){document.documentElement.classList.remove("rboot")});setTimeout(function(){document.documentElement.classList.remove("rboot")},700);
