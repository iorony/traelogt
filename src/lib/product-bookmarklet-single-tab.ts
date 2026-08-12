import {makeProductBookmarklet} from "./product-bookmarklet";

export function makeSingleTabBookmarklet(destination:string){
  const opening=`const target=open('${destination}?'+q.toString(),'traelo_gt_cotizador');if(target)target.focus()`;
  return makeProductBookmarklet(destination).replace(opening,`location.assign('${destination}?'+q.toString())`);
}
