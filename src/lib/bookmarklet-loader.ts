export function makeBookmarkletLoader(scriptOrigin:string,target:string){
  const endpoint=`${scriptOrigin.replace(/\/$/,"")}/api/bookmarklet/script?target=${encodeURIComponent(target)}&t=`;
  return `javascript:(function(){try{var d=document,s=d.createElement('script');s.src='${endpoint}'+Date.now();s.onload=function(){s.remove()};s.onerror=function(){alert('Tráelo GT no pudo cargar el extractor. Verifica que el sitio esté publicado y que /api/bookmarklet/script esté disponible. URL: '+s.src);s.remove()};(d.body||d.documentElement).appendChild(s)}catch(e){alert('No se pudo iniciar el extractor de Tráelo GT: '+e.message)}})();`;
}
