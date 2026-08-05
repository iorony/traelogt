"use client";
import {Check,Plus} from "lucide-react";
import Link from "next/link";
import {useState} from "react";
import type {Product} from "@/lib/types";
import {useCart} from "@/hooks/use-cart";

export default function QuickAddProduct({product}:{product:Product}){
  const addProduct=useCart(state=>state.addProduct);const [added,setAdded]=useState(false);
  if(product.variants?.length)return <Link href={`/productos/${product.slug}`} aria-label={`Elegir variante de ${product.name}`} title="Elegir variante" className="grid h-11 w-11 shrink-0 self-end place-items-center rounded-full border border-black transition hover:bg-black hover:text-white md:h-12 md:w-12"><Plus size={20}/></Link>;
  return <button type="button" disabled={!product.stock} onClick={()=>{addProduct(product);setAdded(true)}} aria-label={added?`${product.name} agregado al carrito`:`Agregar ${product.name} al carrito`} title={added?"Agregado":"Agregar al carrito"} className={`shrink-0 self-end w-11 h-11 md:w-12 md:h-12 rounded-full border grid place-items-center transition disabled:opacity-30 ${added?"bg-black text-white border-black":"border-black hover:bg-black hover:text-white"}`}>{added?<Check size={19}/>:<Plus size={20}/>}</button>;
}
