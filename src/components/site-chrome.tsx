"use client";
import Image from "next/image";import Link from "next/link";import {forwardRef,useLayoutEffect,useRef,useState} from "react";import {ArrowRight,Menu,MessageCircle,Minus,Plus,ShoppingBag,Trash2,UserRound,X} from "lucide-react";
import BrandLogo from "@/components/brand-logo";import {effectivePrice,formatGTQ} from "@/lib/format";import {cartLineKey,cartSubtotal,useCart} from "@/hooks/use-cart";

/**
 * Barra de anuncio + header con menú, cuenta y carrito. Único header para todo el sitio público.
 * Se posiciona fija (no "sticky") para garantizar que quede pegada arriba en todos los navegadores,
 * incluidos los casos donde overflow-x:hidden en html/body rompe el comportamiento de sticky.
 */
export const SiteHeader=forwardRef<HTMLDivElement,{announcement:string;onCart:()=>void}>(function SiteHeader({announcement,onCart},ref){
 const count=useCart(s=>s.hydrated?s.items.reduce((total,item)=>total+item.quantity,0):0);const [menu,setMenu]=useState(false);
 const close=()=>setMenu(false);
 return <div ref={ref} className="fixed top-0 inset-x-0 z-30">
 <div className="bg-black text-white text-center text-xs py-2.5 px-3">{announcement}</div>
 <header className="border-b bg-white relative">
  <div className="container h-20 flex items-center gap-8">
   <button onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-label={menu?"Cerrar menú":"Abrir menú"} className="md:hidden w-10 h-10 grid place-items-center rounded-full border"><Menu/></button>
   <BrandLogo/>
   <nav className="hidden md:flex gap-7 text-sm font-bold ml-4"><Link href="/productos">Productos disponibles</Link><Link href="/cotizar">Cotizar producto</Link><Link href="/rastreo">Rastrear</Link></nav>
   <div className="ml-auto flex items-center gap-5"><Link href="/mi-cuenta" aria-label="Mi cuenta"><UserRound size={20}/></Link><button onClick={onCart} className="relative" aria-label={`Carrito, ${count} artículos`}><ShoppingBag size={22}/>{count>0&&<span className="absolute -top-2 -right-2 bg-[#ff6b00] text-white w-5 h-5 text-[10px] rounded-full grid place-items-center">{count}</span>}</button></div>
  </div>
  {menu&&<nav className="md:hidden absolute top-full inset-x-0 border-t px-4 py-4 grid gap-2 font-bold text-sm bg-white shadow-lg max-h-[75vh] overflow-y-auto"><Link onClick={close} className="p-3 rounded-xl bg-[#f5f5f3]" href="/productos">Productos disponibles</Link><Link onClick={close} className="p-3 rounded-xl bg-[#f5f5f3]" href="/cotizar">Cotizar producto</Link><Link onClick={close} className="p-3 rounded-xl bg-[#f5f5f3]" href="/rastreo">Rastrear</Link></nav>}
 </header>
 </div>});

/** Panel lateral de carrito, disponible desde cualquier página vía SiteHeader. */
export function CartDrawer({open,onClose}:{open:boolean;onClose:()=>void}){
 const items=useCart(s=>s.items),updateQuantity=useCart(s=>s.updateQuantity),removeItem=useCart(s=>s.removeItem);const total=cartSubtotal(items);
 return <><div onClick={onClose} className={`fixed inset-0 bg-black/40 z-40 ${open?"opacity-100":"opacity-0 pointer-events-none"}`}/>
 <aside className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 p-6 transition-transform ${open?"translate-x-0":"translate-x-full"}`}>
  <div className="flex justify-between border-b pb-5"><h2 className="text-2xl font-black">Tu carrito</h2><button onClick={onClose} aria-label="Cerrar carrito"><X/></button></div>
  <div className="py-5 space-y-5">{!items.length&&<p className="text-center py-20 text-[#777]">Aún no agregaste productos.</p>}
   {items.map(i=>{const itemKey=cartLineKey(i);return <div key={itemKey} className="flex gap-4"><div className="relative w-20 h-24 rounded-xl overflow-hidden bg-[#eee]">{i.main_image_url&&<Image src={i.main_image_url} alt="" fill className="object-cover"/>}</div>
    <div className="flex-1"><p className="font-bold">{i.name}</p>{i.details&&<p className="text-xs text-[#777]">{i.details}</p>}<p>{formatGTQ(effectivePrice(i))}</p>
     <div className="flex gap-3 mt-3 items-center"><button onClick={()=>updateQuantity(itemKey,i.quantity-1)} aria-label="Restar"><Minus size={15}/></button><span>{i.quantity}</span><button onClick={()=>updateQuantity(itemKey,i.quantity+1)} aria-label="Sumar"><Plus size={15}/></button><button className="ml-auto text-red-600" onClick={()=>removeItem(itemKey)} aria-label="Eliminar"><Trash2 size={16}/></button></div>
    </div></div>})}
  </div>
  {items.length>0&&<div className="absolute bottom-0 left-0 right-0 border-t bg-white p-6"><div className="flex justify-between font-black text-lg mb-4"><span>Subtotal</span><span>{formatGTQ(total)}</span></div><Link href="/checkout" onClick={onClose} className="btn btn-primary w-full">Finalizar compra <ArrowRight size={17}/></Link></div>}
 </aside></>}

/** Pie de página único para todo el sitio público. */
export function SiteFooter(){return <footer className="bg-black text-white py-12"><div className="container flex flex-wrap justify-between gap-7"><BrandLogo light/><div><p className="font-bold">Tráelo GT</p><p className="text-white/60 text-sm mt-2">Rápido · Seguro · Confiable</p></div><a href="https://www.instagram.com/somos.traelogt" target="_blank" rel="noreferrer" className="font-bold">@somos.traelogt</a></div></footer>}

/** Botón flotante de WhatsApp, presente en todas las páginas públicas. */
export function WhatsAppButton(){return <a href="https://wa.me/50242902957" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 bg-[#25d366] text-white rounded-full w-14 h-14 grid place-items-center shadow-xl z-30" aria-label="WhatsApp"><MessageCircle/></a>}

/**
 * Envoltorio único para cualquier página pública: header + carrito + footer + WhatsApp.
 * El header es fixed, así que este componente mide su altura real (con ResizeObserver, se ajusta
 * si el texto del anuncio cambia de tamaño) y agrega un espaciador para que el contenido no quede tapado.
 */
export default function PublicChrome({announcement,children}:{announcement:string;children:React.ReactNode}){
 const [cart,setCart]=useState(false);
 const headerRef=useRef<HTMLDivElement>(null);
 const [offset,setOffset]=useState(112);
 useLayoutEffect(()=>{
  const el=headerRef.current;if(!el)return;
  const update=()=>setOffset(el.offsetHeight);
  update();
  const ro=new ResizeObserver(update);ro.observe(el);
  return ()=>ro.disconnect();
 },[]);
 return <>
  <SiteHeader ref={headerRef} announcement={announcement} onCart={()=>setCart(true)}/>
  <div style={{height:offset}} aria-hidden/>
  {children}
  <SiteFooter/>
  <WhatsAppButton/>
  <CartDrawer open={cart} onClose={()=>setCart(false)}/>
 </>}
