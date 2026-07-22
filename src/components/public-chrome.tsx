"use client";

import {usePathname} from "next/navigation";
import {useState} from "react";
import {CartDrawer,Header} from "@/components/store";

export default function PublicChrome(){
  const pathname=usePathname();
  const [cartOpen,setCartOpen]=useState(false);

  if(pathname.startsWith("/admin")) return null;

  return <>
    <Header onCart={()=>setCartOpen(true)}/>
    <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)}/>
  </>;
}
