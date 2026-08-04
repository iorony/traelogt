"use client";

import {create} from "zustand";
import {createJSONStorage,persist} from "zustand/middleware";
import {effectivePrice} from "@/lib/format";
import type {CartItem,Product} from "@/lib/types";

const lineKey=(item:Pick<CartItem,"id"|"details">)=>`${item.id}:${item.details?.trim().toLowerCase()??""}`;

type CartState={
  items:CartItem[];
  hydrated:boolean;
  setHydrated:(value:boolean)=>void;
  addProduct:(product:Product,details?:string,quantity?:number)=>void;
  updateQuantity:(key:string,quantity:number)=>void;
  removeItem:(key:string)=>void;
  clear:()=>void;
};

export const useCart=create<CartState>()(persist((set)=>({
  items:[],
  hydrated:false,
  setHydrated:(hydrated)=>set({hydrated}),
  addProduct:(product,details="",quantity=1)=>set((state)=>{
    const incoming:CartItem={...product,details:details.trim()||undefined,quantity};
    const key=lineKey(incoming);
    const found=state.items.find((item)=>lineKey(item)===key);
    if(found)return {items:state.items.map((item)=>lineKey(item)===key?{...item,quantity:Math.min(item.stock,item.quantity+quantity)}:item)};
    return {items:[...state.items,{...incoming,quantity:Math.min(product.stock,Math.max(1,quantity))}]};
  }),
  updateQuantity:(key,quantity)=>set((state)=>({items:state.items.map((item)=>lineKey(item)===key?{...item,quantity:Math.min(item.stock,Math.max(1,quantity))}:item)})),
  removeItem:(key)=>set((state)=>({items:state.items.filter((item)=>lineKey(item)!==key)})),
  clear:()=>set({items:[]}),
}),{
  name:"traelo-cart",
  storage:createJSONStorage(()=>localStorage),
  version:1,
  migrate:(persisted)=>{
    const value=persisted as {items?:CartItem[]}|CartItem[]|undefined;
    return {items:Array.isArray(value)?value:value?.items??[],hydrated:false};
  },
  partialize:(state)=>({items:state.items}) as CartState,
  onRehydrateStorage:()=>state=>state?.setHydrated(true),
}));

export const cartLineKey=lineKey;
export const cartSubtotal=(items:CartItem[])=>items.reduce((sum,item)=>sum+effectivePrice(item)*item.quantity,0);
