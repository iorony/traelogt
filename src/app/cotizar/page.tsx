"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Bookmark,CheckCircle2,Clipboard,Download,ExternalLink,ImageIcon,Link2,Monitor,Plus,ShoppingBag,Smartphone,Trash2} from "lucide-react";
import PublicChrome from "@/components/site-chrome";
import {makeTemuCompatibleBookmarklet} from "@/lib/product-bookmarklet-temu";

type StoreKey="temu"|"shein"|"aliexpress"|"amazon"|"other";
type Currency="USD"|"MXN"|"GTQ";
type Item={store:StoreKey;url:string;name:string;price:number|string;currency:Currency;quantity:number;details:string;image?:string};
type ImportResult={store:StoreKey;url:string;name:string;price:number|string;currency:Currency;image?:string;message?:string};

const stores=[
  {key:"temu" as const,name:"TEMU",url:"https://www.temu.com/mx"},
  {key:"shein" as const,name:"SHEIN",url:"https://shein.com.mx/"},
  {key:"aliexpress" as const,name:"AliExpress",url:"https://es.aliexpress.com/"},
  {key:"amazon" as const,name:"amazon",url:"https://www.amazon.com/"},
];
const empty=(store:StoreKey="temu"):Item=>({store,url:"",name:"",price:"",currency:store==="amazon"?"USD":store==="other"?"GTQ":"MXN",quantity:1,details:"",image:""});
const quoteDraftKey="traelo-gt-quote-items";
function savedItems(){try{const value=JSON.parse(localStorage.getItem(quoteDraftKey)||"[]");return Array.isArray(value)?value.slice(0,20) as Item[]:[]}catch{return []}}

function makeBookmarklet(destination:string){
  return `javascript:(()=>{try{const t=(s,r=document)=>r.querySelector(s)?.textContent?.trim()||'',m=k=>document.querySelector('meta[property="'+k+'"],meta[name="'+k+'"]')?.content||'',h=location.hostname,store=h.includes('temu')?'temu':h.includes('shein')?'shein':h.includes('aliexpress')?'aliexpress':h.includes('amazon')?'amazon':'other';let raw='';if(store==='amazon'){for(const s of ['#corePriceDisplay_desktop_feature_div','#corePrice_feature_div','#apex_desktop','#buybox']){const r=document.querySelector(s);if(!r)continue;raw=t('.a-price:not(.a-text-price) .a-offscreen',r)||t('.priceToPay .a-offscreen',r);if(!raw){const w=t('.a-price:not(.a-text-price) .a-price-whole',r).replace(/[^\\d]/g,''),f=t('.a-price:not(.a-text-price) .a-price-fraction',r).replace(/[^\\d]/g,'');if(w)raw=w+'.'+(f||'00')}if(raw)break}}for(const s of ['[itemprop="price"]','[data-price]','[class*="product-intro__head-price"]','[class*="price--current"]','[class*="salePrice"]']){if(raw)break;const e=document.querySelector(s),v=e?.getAttribute('content')||e?.getAttribute('data-price')||e?.textContent;if(v&&/\\d/.test(v))raw=v}const x=String(raw||m('product:price:amount')||m('og:price:amount')).replace(/\\s/g,'').match(/\\d[\\d.,]*/)?.[0]||'',c=x.lastIndexOf(','),d=x.lastIndexOf('.');let n=x;if(c>=0&&d>=0)n=c>d?x.replace(/\\./g,'').replace(',','.'):x.replace(/,/g,'');else if(c>=0)n=/,\\d{1,2}$/.test(x)?x.replace(',','.'):x.replace(/,/g,'');const price=String(Number(n)||'');if(!price){alert('No encontramos el precio. Selecciona una variante o vendedor y vuelve a pulsar el favorito.');return}const name=(m('og:title')||t('#productTitle')||document.title).trim(),image=m('og:image'),currency=m('product:price:currency')||m('og:price:currency')||(store==='amazon'?'USD':'MXN'),variant=(t('#variation_color_name .selection')||t('#variation_size_name .selection')).trim(),q=new URLSearchParams({capture:'1',store,url:location.href,name,price,currency:String(currency).toUpperCase(),image,details:variant?'Variante: '+variant:''});alert('Datos encontrados por Tráelo GT:\\n\\nNombre: '+name+'\\nPrecio: '+price+' '+String(currency).toUpperCase()+(variant?'\\nVariante: '+variant:'')+'\\n\\nPulsa Aceptar para agregarlos.');open('${destination}?'+q.toString(),'_blank')}catch(e){alert('No fue posible extraer el producto. Copia el enlace y pégalo en Tráelo GT.')}})();`;
}

export default function Cotizar(){
  const bookmarkletLink=useRef<HTMLAnchorElement>(null);
  const [items,setItems]=useState<Item[]>([empty()]);
  const [draftReady,setDraftReady]=useState(false);
  const [loading,setLoading]=useState(false);
  const [importing,setImporting]=useState<number|null>(null);
  const [messages,setMessages]=useState<Record<number,{tone:"success"|"error";text:string}>>({});
  const [bookmarklet,setBookmarklet]=useState("");
  const [copied,setCopied]=useState(false);
  const [error,setError]=useState("");
  const [reference,setReference]=useState("");
  const [whatsapp,setWhatsapp]=useState("50258221607");

  useEffect(()=>{
    window.name="traelo_gt_cotizador";
    fetch("/api/store-settings").then(r=>r.ok?r.json():null).then(data=>data?.whatsapp&&setWhatsapp(data.whatsapp)).catch(()=>undefined);
    const params=new URLSearchParams(location.search),store=params.get("tienda") as StoreKey|null,saved=savedItems();
    if(params.get("capture")==="1"){
      const capturedStore=(params.get("store")||"other") as StoreKey,captured:Item={...empty(capturedStore),url:params.get("url")||"",name:(params.get("name")||"").slice(0,250),price:params.get("price")||"",currency:(["USD","MXN","GTQ"].includes(params.get("currency")||"")?params.get("currency"):"USD") as Currency,image:params.get("image")||"",details:(params.get("details")||"").slice(0,300)};
      const base=saved.filter(item=>item.url||item.name),next=[...base,captured].slice(-20);setItems(next);setMessages({[next.length-1]:{tone:"success",text:"Producto agregado a tu lista desde el favorito. Revisa sus datos antes de cotizar."}});
      history.replaceState(null,"","/cotizar");
    }else if(store&&["temu","shein","aliexpress","amazon"].includes(store))setItems(saved.length?[...saved,empty(store)].slice(-20):[empty(store)]);
    else if(saved.length)setItems(saved);
    const destination=`${location.origin}/cotizar`,code=`javascript:(()=>{try{const m=k=>document.querySelector('meta[property="'+k+'"],meta[name="'+k+'"]')?.content||'';let j={};for(const s of document.querySelectorAll('script[type="application/ld+json"]')){try{const x=JSON.parse(s.textContent),a=Array.isArray(x)?x:[x],p=a.find(v=>v&&v['@type']==='Product')||a.flatMap(v=>v?.['@graph']||[]).find(v=>v?.['@type']==='Product');if(p){j=p;break}}catch(e){}}const o=Array.isArray(j.offers)?j.offers[0]:(j.offers||{}),h=location.hostname,store=h.includes('temu')?'temu':h.includes('shein')?'shein':h.includes('aliexpress')?'aliexpress':h.includes('amazon')?'amazon':'other',image=typeof j.image==='string'?j.image:Array.isArray(j.image)?j.image[0]:m('og:image'),q=new URLSearchParams({capture:'1',store,url:location.href,name:j.name||m('og:title')||document.title,price:String(o.price||m('product:price:amount')||''),currency:o.priceCurrency||m('product:price:currency')||(h.includes('amazon')?'USD':'MXN'),image:image||''});open('${destination}?'+q.toString(),'_blank')}catch(e){alert('No fue posible leer este producto. Copia su enlace y pégalo en Tráelo GT.')}})();`;
    // Temu bloquea scripts externos mediante CSP; el favorito debe ser autónomo.
    setBookmarklet(makeTemuCompatibleBookmarklet(destination));
    setDraftReady(true);
  },[]);

  useEffect(()=>{if(draftReady)localStorage.setItem(quoteDraftKey,JSON.stringify(items))},[items,draftReady]);

  useEffect(()=>{if(bookmarklet&&bookmarkletLink.current)bookmarkletLink.current.setAttribute("href",bookmarklet)},[bookmarklet]);

  const update=<K extends keyof Item>(index:number,key:K,value:Item[K])=>setItems(current=>current.map((item,i)=>i===index?{...item,[key]:value}:item));
  const selectStore=(store:StoreKey)=>setItems(current=>current.length===1&&!current[0].url&&!current[0].name?[empty(store)]:[...current,empty(store)]);

  async function importProduct(index:number,urlOverride?:string){
    const url=(urlOverride??items[index]?.url??"").trim();
    if(!url){setMessages(current=>({...current,[index]:{tone:"error",text:"Primero pega el enlace del producto."}}));return}
    setImporting(index);
    setMessages(current=>{const next={...current};delete next[index];return next});
    try{
      const response=await fetch("/api/product-import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudieron obtener los datos");
      const imported=data as ImportResult;
      setItems(current=>current.map((item,i)=>i===index?{...item,store:imported.store,url:imported.url,name:imported.name||item.name,price:imported.price!==""?imported.price:item.price,currency:imported.currency||item.currency,image:imported.image||item.image}:item));
      setMessages(current=>({...current,[index]:{tone:"success",text:imported.message||"Datos importados. Revisa la información antes de cotizar."}}));
    }catch(reason){
      setMessages(current=>({...current,[index]:{tone:"error",text:reason instanceof Error?reason.message:"No se pudieron obtener los datos"}}));
    }finally{setImporting(null)}
  }

  function pasteAndImport(index:number,event:React.ClipboardEvent<HTMLInputElement>){
    const pasted=event.clipboardData.getData("text").trim();
    if(!/^https?:\/\//i.test(pasted))return;
    event.preventDefault();update(index,"url",pasted);void importProduct(index,pasted);
  }

  async function copyBookmarklet(){
    if(!bookmarklet)return;
    await navigator.clipboard.writeText(bookmarklet);setCopied(true);setTimeout(()=>setCopied(false),2200);
  }

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError("");
    const form=new FormData(event.currentTarget),response=await fetch("/api/quotes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({firstName:form.get("firstName"),lastName:form.get("lastName"),phone:form.get("phone"),email:form.get("email"),address:form.get("address"),notes:form.get("notes"),items:items.map(item=>({...item,price:Number(item.price)}))})}),data=await response.json();
    setLoading(false);if(!response.ok){setError(data.error||"No se pudo enviar la solicitud");return}localStorage.removeItem(quoteDraftKey);setReference(data.reference);
  }

  if(reference)return <main className="grid min-h-screen place-items-center bg-black p-5 text-white"><div className="max-w-lg text-center"><CheckCircle2 size={58} className="mx-auto text-[#ff6b00]"/><h1 className="mt-6 text-4xl font-black">¡Solicitud recibida!</h1><p className="mt-4 text-white/70">Tu referencia es <strong className="text-white">{reference}</strong>. Revisaremos tu lista y te enviaremos el precio final en Guatemala.</p><a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola Tráelo GT, solicité la cotización ${reference}.`)}`} className="btn btn-primary mt-8 w-full">Continuar por WhatsApp</a><Link href="/" className="btn mt-3 w-full border border-white/30">Volver al inicio</Link></div></main>;

  return <PublicChrome announcement="Cotiza cualquier producto internacional, sin compromiso"><main className="min-h-screen bg-[#f5f5f3] py-8"><div className="container max-w-6xl">
    <section className="rounded-[28px] bg-black p-6 text-white md:p-8">
      <p className="eyebrow">1. Elegí una tienda</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Explora el producto y agrégalo con su enlace.</h1>
      <p className="mt-3 max-w-3xl text-sm text-white/65">Abre la tienda, busca el producto y copia su enlace. Al regresar, el botón “Obtener datos” intentará completar la información automáticamente.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{stores.map(store=><a key={store.key} href={store.url} target="_blank" rel="noopener noreferrer" onClick={()=>selectStore(store.key)} className="group flex min-h-24 flex-col items-center justify-center rounded-2xl border border-white/35 px-4 py-4 text-center text-white transition hover:-translate-y-0.5 hover:border-[#ff6b00]"><strong className="text-xl font-black text-white">{store.name}</strong><span className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-white/65 group-hover:text-[#ff6b00]">Abrir tienda <ExternalLink size={14}/></span></a>)}</div>
      <details className="mt-5 rounded-2xl border border-white/20 bg-white/5 p-4">
        <summary className="bookmarklet-summary cursor-pointer list-none font-bold"><Bookmark size={18} className="text-[#ff6b00]"/><span>Instalar el botón “Agregar a Tráelo GT”</span><span className="whitespace-nowrap text-xs font-normal text-white/50">Versión automática 2.0 · Ver instrucciones</span></summary>
        <div className="mt-4 border-t border-white/15 pt-4 text-sm text-white/75">
          <p className="max-w-3xl">Extrae automáticamente producto, precio, moneda y opciones. Si tu favorito solicita escribir el precio, aún tienes una versión anterior: elimínalo y vuelve a instalar el botón marcado como versión automática 2.0.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <section className="rounded-2xl bg-white/10 p-4"><h3 className="flex items-center gap-2 font-black text-white"><Monitor size={18} className="text-[#ff6b00]"/>Opción fácil en computadora</h3><ol className="mt-3 list-decimal space-y-2 pl-5"><li>Muestra la barra de favoritos con <strong className="text-white">Ctrl + Shift + B</strong>.</li><li>Arrastra el botón naranja de abajo hasta esa barra.</li><li>Abre un producto en Temu, SHEIN, AliExpress o Amazon.</li><li>Pulsa <strong className="text-white">Agregar a Tráelo GT</strong> en tu barra.</li></ol><a ref={bookmarkletLink} href="#instalar" onClick={e=>e.preventDefault()} draggable className="btn btn-primary mt-4 w-full select-none"><Bookmark size={17}/>Agregar a Tráelo GT</a><p className="mt-2 text-center text-xs text-white/50">No le des clic: mantén presionado y arrástralo a la barra.</p></section>
            <section className="rounded-2xl bg-white/10 p-4"><h3 className="flex items-center gap-2 font-black text-white"><Smartphone size={18} className="text-[#ff6b00]"/>Alternativa manual o teléfono</h3><ol className="mt-3 list-decimal space-y-2 pl-5"><li>Pulsa <strong className="text-white">Copiar código</strong>.</li><li>Crea cualquier favorito en tu navegador.</li><li>Edita ese favorito y escribe <strong className="text-white">Agregar a Tráelo GT</strong> en “Nombre”.</li><li>Borra lo que aparece en “URL” o “Dirección” y pega el código copiado.</li><li>Guarda los cambios y úsalo mientras ves un producto.</li></ol><button type="button" onClick={copyBookmarklet} className="btn mt-4 w-full bg-white text-black"><Clipboard size={17}/>{copied?"¡Código copiado!":"Copiar código del favorito"}</button><p className="mt-2 text-xs text-white/50">Algunos navegadores móviles no permiten este tipo de favorito. En ese caso, copia el enlace del producto y pégalo en el formulario.</p></section>
          </div>
          <div className="mt-3 rounded-xl border border-[#ff6b00]/40 bg-[#ff6b00]/10 p-3 text-xs"><strong className="text-[#ff9b52]">¿Cómo usarlo?</strong> Visita el producto → selecciona talla o color → pulsa el favorito → revisa los datos que aparecen en Tráelo GT.</div>
        </div>
      </details>
    </section>

    <form onSubmit={submit} className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4"><div className="card p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">2. Lista de cotización</p><h2 className="mt-1 text-2xl font-black">Productos seleccionados</h2></div><span className="chip flex items-center gap-2"><ShoppingBag size={15}/>{items.length} {items.length===1?"producto":"productos"}</span></div>
        <div className="mt-5 space-y-4">{items.map((item,index)=><article key={index} className="rounded-2xl border border-[#deded9] bg-[#fafaf8] p-4">
          <div className="flex items-center justify-between"><strong>Producto {index+1}</strong>{items.length>1&&<button type="button" onClick={()=>setItems(current=>current.filter((_,i)=>i!==index))} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Eliminar producto"><Trash2 size={17}/></button>}</div>
          <div className="mt-3 rounded-2xl border border-[#ffd2b3] bg-[#fff7f0] p-3"><label className="text-sm font-bold"><span className="flex items-center gap-1.5"><Link2 size={15}/>Enlace del producto</span></label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input type="url" required value={item.url} onPaste={e=>pasteAndImport(index,e)} onChange={e=>update(index,"url",e.target.value)} className="field min-w-0 flex-1 bg-white" placeholder="Pega el enlace; intentaremos completar los datos automáticamente"/><button type="button" onClick={()=>importProduct(index)} disabled={importing===index} className="btn btn-primary shrink-0 disabled:opacity-60"><Download size={17}/>{importing===index?"Obteniendo…":"Obtener datos"}</button></div><p className="mt-2 text-xs text-[#8a5a37]">Al pegar un enlace compatible, la extracción comienza automáticamente.</p>{messages[index]&&<p className={`mt-2 text-xs font-medium ${messages[index].tone==="success"?"text-green-700":"text-red-700"}`}>{messages[index].text}</p>}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Tienda<select value={item.store} onChange={e=>update(index,"store",e.target.value as StoreKey)} className="field mt-1.5"><option value="temu">Temu</option><option value="shein">SHEIN</option><option value="aliexpress">AliExpress</option><option value="amazon">Amazon</option><option value="other">Otra tienda</option></select></label>
            <label className="text-sm">Nombre del producto *<input required value={item.name} onChange={e=>update(index,"name",e.target.value)} className="field mt-1.5" placeholder="Ej. Audífonos inalámbricos"/></label>
            <div className="grid grid-cols-[1fr_100px] gap-3"><label className="text-sm">Precio publicado *<input type="number" min="0" step="0.01" required value={item.price} onChange={e=>update(index,"price",e.target.value)} className="field mt-1.5"/></label><label className="text-sm">Moneda<select value={item.currency} onChange={e=>update(index,"currency",e.target.value as Currency)} className="field mt-1.5"><option>USD</option><option>MXN</option><option>GTQ</option></select></label></div>
            <label className="text-sm">Cantidad *<input type="number" min="1" max="99" required value={item.quantity} onChange={e=>update(index,"quantity",Number(e.target.value))} className="field mt-1.5"/></label>
            <label className="text-sm sm:col-span-2">Talla, color o variante<input value={item.details} onChange={e=>update(index,"details",e.target.value)} className="field mt-1.5" placeholder="Ej. color negro, talla M"/></label>
            {item.image&&<div className="sm:col-span-2"><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#666]"><ImageIcon size={14}/>Imagen encontrada</p><div className="h-32 w-32 overflow-hidden rounded-xl border bg-white"><img src={item.image} alt="Vista previa del producto" className="h-full w-full object-contain" referrerPolicy="no-referrer"/></div></div>}
          </div>
        </article>)}</div>
        <button type="button" onClick={()=>setItems(current=>[...current,empty("other")])} className="btn btn-outline mt-4 w-full"><Plus size={17}/>Agregar otro producto</button>
      </div></section>
      <aside className="card p-5 lg:sticky lg:top-20"><p className="eyebrow">3. Tus datos</p><h2 className="mt-1 text-xl font-black">¿A quién enviamos la cotización?</h2><div className="mt-4 space-y-3"><label className="block text-sm">Nombre *<input name="firstName" required className="field mt-1.5"/></label><label className="block text-sm">Apellido *<input name="lastName" required className="field mt-1.5"/></label><label className="block text-sm">WhatsApp *<input name="phone" required pattern="\d{4}-?\d{4}" placeholder="0000-0000" className="field mt-1.5"/></label><label className="block text-sm">Correo opcional<input name="email" type="email" className="field mt-1.5"/></label><label className="block text-sm">Dirección opcional<input name="address" className="field mt-1.5"/></label><label className="block text-sm">Comentarios<textarea name="notes" rows={3} className="field mt-1.5"/></label></div>{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="btn btn-primary mt-5 w-full">{loading?"Enviando…":`Cotizar ${items.length} ${items.length===1?"producto":"productos"}`}</button><p className="mt-3 text-center text-xs text-[#777]">Verifica los datos importados. El precio final incluirá cambio, importación y entrega.</p></aside>
    </form>
  </div></main></PublicChrome>;
}
