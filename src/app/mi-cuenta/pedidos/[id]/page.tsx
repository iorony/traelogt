import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ExternalLink} from "lucide-react";
import PublicChrome from "@/components/site-chrome";
import {createClient} from "@/lib/supabase/server";
import {formatGTQ} from "@/lib/format";
import {defaultStatusMessage,OrderStatus,statusLabel} from "@/lib/order-status";

export default async function CustomerOrderDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params,db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)redirect("/login");
  const {data:order}=await db.from("orders").select("id,order_number,tracking_code,status,total,payment_method,payment_status,created_at,address,department,municipality,order_items(id,product_name,sku,quantity,unit_price,subtotal,image_url)").eq("id",id).eq("customer_id",user.id).single();
  if(!order)notFound();
  const message=defaultStatusMessage(order.status as OrderStatus),items=Array.isArray(order.order_items)?order.order_items:[];
  return <PublicChrome><main className="min-h-screen bg-[#f5f5f3] py-8"><div className="container max-w-4xl"><Link href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-bold text-[#666]"><ArrowLeft size={17}/>Mi cuenta</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Detalle del pedido</p><h1 className="mt-1 text-3xl font-black">{order.order_number}</h1><p className="mt-2 text-sm text-[#777]">Rastreo: {order.tracking_code}</p></div><span className="chip">{statusLabel(order.status)}</span></div><section className="card mt-6 p-5 md:p-7"><h2 className="text-xl font-black">Estado actual</h2><p className="mt-2 text-[#666]">{message}</p><dl className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2"><Row label="Fecha" value={new Date(order.created_at).toLocaleString("es-GT")}/><Row label="Total" value={formatGTQ(Number(order.total))}/><Row label="Forma de pago" value={String(order.payment_method).replaceAll("_"," ")}/><Row label="Estado de pago" value={String(order.payment_status).replaceAll("_"," ")}/><Row label="Entrega" value={[order.address,order.municipality,order.department].filter(Boolean).join(", ")||"Por confirmar"}/></dl></section><section className="card mt-5"><h2 className="border-b px-5 py-4 text-lg font-black">Productos</h2><div className="divide-y">{items.map(item=><div key={item.id} className="flex items-center justify-between gap-4 p-5"><div><strong>{item.product_name}</strong><p className="mt-1 text-sm text-[#777]">SKU: {item.sku} · Cantidad: {item.quantity}</p></div><strong>{formatGTQ(Number(item.subtotal))}</strong></div>)}</div></section><Link href={`/rastreo`} className="btn btn-primary mt-5 w-full"><ExternalLink size={17}/>Abrir rastreo público</Link></div></main></PublicChrome>;
}
function Row({label,value}:{label:string;value:string}){return <div><dt className="text-xs font-bold uppercase tracking-wide text-[#888]">{label}</dt><dd className="mt-1 capitalize">{value}</dd></div>}
