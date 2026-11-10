if('serviceWorker' in navigator&&location.protocol==='https:'){
window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});
}
