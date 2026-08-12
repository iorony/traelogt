import Link from "next/link";
import {ArrowRight,FileSearch,Link2,Package} from "lucide-react";
import {linkOrder} from "@/app/mi-cuenta/link-order-action";
import {createClient} from "@/lib/supabase/server";
import {formatGTQ} from "@/lib/format";

const quoteLabels:Record<string,string>={pending:"Pendiente",reviewing:"En revisión",quoted:"Cotizada",approved:"Aprobada",rejected:"Rechazada",purchased:"Comprada",completed:"Completada",cancelled:"Cancelada"};

export default async function LinkOrderForm({phone}:{phone:string}){
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  const [quoteResult,orderResult]=user?await Promise.all([db.from("quote_requests").select("id,reference,status,items,total,final_price_guatemala,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),db.from("orders").select("id,order_number,status").eq("customer_id",user.id).order("created_at",{ascending:false})]):[{data:[],error:null},{data:[],error:null}];
  const {data:quotes,error}=quoteResult,{data:orders}=orderResult;

  return <>
    <details className="mt-5 border-t pt-5"><summary className="flex cursor-pointer items-center gap-2 font-bold text-[#e45f00]"><Link2 size={18}/> Asociar pedido o cotización de invitado</summary><form action={linkOrder} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm">Referencia PED, COT o código GT<input name="orderIdentifier" required className="field mt-2 uppercase" placeholder="PED-2026-000007 o COT-2026-ABC123"/></label><label className="text-sm">Teléfono utilizado<input name="orderPhone" required defaultValue={phone} className="field mt-2" placeholder="0000-0000"/></label><button className="btn btn-primary self-end"><Link2 size={17}/>Asociar</button></form><p className="mt-3 text-xs text-[#777]">Puedes asociar pedidos y cotizaciones creados como invitado cuando el teléfono coincida.</p></details>
    {!!orders?.length&&<section className="mt-6 border-t pt-6"><h2 className="flex items-center gap-2 text-lg font-black"><Package size={20} className="text-[#ff6b00]"/>Consultar mis pedidos</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{orders.map(order=><Link key={order.id} href={`/mi-cuenta/pedidos/${order.id}`} className="flex items-center justify-between rounded-xl border px-4 py-3 transition hover:border-[#ff9d59] hover:bg-[#fff8f3]"><span><strong className="block text-sm">{order.order_number}</strong><small className="text-[#777]">Ver productos y seguimiento</small></span><ArrowRight size={17}/></Link>)}</div></section>}
    <section className="mt-7 border-t pt-6">
      <div className="flex items-center gap-3"><FileSearch className="text-[#ff6b00]"/><div><h2 className="text-2xl font-black">Mis cotizaciones</h2><p className="text-sm text-[#777]">Solicitudes realizadas con esta cuenta.</p></div></div>
      {error&&<p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">No fue posible cargar tus cotizaciones.</p>}
      {!error&&!quotes?.length&&<p className="py-7 text-[#777]">Aún no tenés cotizaciones asociadas a esta cuenta.</p>}
      {!!quotes?.length&&<div className="mt-5 divide-y">{quotes.map(quote=>{const count=Array.isArray(quote.items)?quote.items.length:0,price=quote.final_price_guatemala??quote.total;return <Link href={`/mi-cuenta/cotizaciones/${quote.id}`} key={quote.id} className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:bg-[#fff8f3]"><div><strong className="text-[#d95700]">{quote.reference}</strong><p className="mt-1 text-sm text-[#777]">{count} {count===1?"producto":"productos"} · {new Date(quote.created_at).toLocaleDateString("es-GT")}</p></div><div className="flex items-center gap-3"><div className="text-right"><span className="chip">{quoteLabels[quote.status]??quote.status}</span><p className="mt-2 font-bold">{price==null?"Precio pendiente":formatGTQ(Number(price))}</p></div><ArrowRight size={17}/></div></Link>})}</div>}
    </section>
  </>;
}
