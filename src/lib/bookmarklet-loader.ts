export function makeBookmarkletLoader(scriptOrigin:string,target:string){
  const endpoint=`${scriptOrigin.replace(/\/$/,"")}/api/bookmarklet/script?target=${encodeURIComponent(target)}&t=`;
  return `javascript:(function(){var d=document,s=d.createElement('script');s.src='${endpoint}'+Date.now();d.body.appendChild(s)})();`;
}
