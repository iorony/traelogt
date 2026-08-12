import {FileSearch,Link2} from "lucide-react";
import {linkOrder} from "@/app/mi-cuenta/link-order-action";
import {createClient} from "@/lib/supabase/server";
import {formatGTQ} from "@/lib/format";

const quoteLabels:Record<string,string>={pending:"Pendiente",reviewing:"En revisión",quoted:"Cotizada",approved:"Aprobada",rejected:"Rechazada",purchased:"Comprada",completed:"Completada",cancelled:"Cancelada"};

export default async function LinkOrderForm({phone}:{phone:string}){
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  const {data:quotes,error}=user?await db.from("quote_requests").select("id,reference,status,items,total,final_price_guatemala,created_at").eq("user_id",user.id).order("created_at",{ascending:false}):{data:[],error:null};

  return <>
    <details className="mt-5 border-t pt-5"><summary className="flex cursor-pointer items-center gap-2 font-bold text-[#e45f00]"><Link2 size={18}/> Asociar un pedido realizado como invitado</summary><form action={linkOrder} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm">Número PED o código GT<input name="orderIdentifier" required className="field mt-2 uppercase" placeholder="PED-2026-000007"/></label><label className="text-sm">Teléfono usado en el pedido<input name="orderPhone" required defaultValue={phone} className="field mt-2" placeholder="0000-0000"/></label><button className="btn btn-primary self-end"><Link2 size={17}/>Asociar</button></form><p className="mt-3 text-xs text-[#777]">Solo se puede asociar un pedido sin cuenta y cuyo teléfono coincida.</p></details>
    <section className="mt-7 border-t pt-6">
      <div className="flex items-center gap-3"><FileSearch className="text-[#ff6b00]"/><div><h2 className="text-2xl font-black">Mis cotizaciones</h2><p className="text-sm text-[#777]">Solicitudes realizadas con esta cuenta.</p></div></div>
      {error&&<p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">No fue posible cargar tus cotizaciones.</p>}
      {!error&&!quotes?.length&&<p className="py-7 text-[#777]">Aún no tenés cotizaciones asociadas a esta cuenta.</p>}
      {!!quotes?.length&&<div className="mt-5 divide-y">{quotes.map(quote=>{const count=Array.isArray(quote.items)?quote.items.length:0,price=quote.final_price_guatemala??quote.total;return <article key={quote.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><strong className="text-[#d95700]">{quote.reference}</strong><p className="mt-1 text-sm text-[#777]">{count} {count===1?"producto":"productos"} · {new Date(quote.created_at).toLocaleDateString("es-GT")}</p></div><div className="text-right"><span className="chip">{quoteLabels[quote.status]??quote.status}</span><p className="mt-2 font-bold">{price==null?"Precio pendiente":formatGTQ(Number(price))}</p></div></article>})}</div>}
    </section>
  </>;
}
