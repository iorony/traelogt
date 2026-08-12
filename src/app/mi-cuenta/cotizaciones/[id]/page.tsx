import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ArrowLeft,ExternalLink} from "lucide-react";
import PublicChrome from "@/components/site-chrome";
import {createClient} from "@/lib/supabase/server";
import {formatGTQ} from "@/lib/format";

type Item={url:string;name?:string;store?:string;quantity:number;price?:number;currency?:string;details?:string};
const labels:Record<string,string>={pending:"Pendiente",reviewing:"En revisión",quoted:"Cotizada",approved:"Aprobada",rejected:"Rechazada",purchased:"Comprada",completed:"Completada",cancelled:"Cancelada"};

export default async function CustomerQuoteDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params,db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)redirect("/login");
  const {data:quote}=await db.from("quote_requests").select("id,reference,status,items,total,final_price_guatemala,created_at,quoted_at,address,notes").eq("id",id).eq("user_id",user.id).single();
  if(!quote)notFound();
  const items=(Array.isArray(quote.items)?quote.items:[]) as Item[],price=quote.final_price_guatemala??quote.total;
  return <PublicChrome><main className="min-h-screen bg-[#f5f5f3] py-8"><div className="container max-w-4xl"><Link href="/mi-cuenta" className="inline-flex items-center gap-2 text-sm font-bold text-[#666]"><ArrowLeft size={17}/>Mi cuenta</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Detalle de la cotización</p><h1 className="mt-1 text-3xl font-black">{quote.reference}</h1><p className="mt-2 text-sm text-[#777]">Solicitada el {new Date(quote.created_at).toLocaleString("es-GT")}</p></div><span className="chip">{labels[quote.status]??quote.status}</span></div><section className="card mt-6 p-5 md:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-black">Resumen</h2><p className="mt-1 text-sm text-[#777]">{quote.quoted_at?`Cotizada el ${new Date(quote.quoted_at).toLocaleString("es-GT")}`:"El equipo está revisando tu solicitud."}</p></div><strong className="text-xl">{price==null?"Precio pendiente":formatGTQ(Number(price))}</strong></div>{quote.notes&&<p className="mt-5 border-t pt-5 text-sm"><strong>Comentarios:</strong> {quote.notes}</p>}</section><section className="card mt-5"><h2 className="border-b px-5 py-4 text-lg font-black">Productos solicitados</h2><div className="divide-y">{items.map((item,index)=><div key={`${item.url}-${index}`} className="flex flex-wrap items-start justify-between gap-4 p-5"><div><strong>{item.name||`Producto ${index+1}`}</strong><p className="mt-1 text-sm text-[#777]">Cantidad: {item.quantity}{item.details?` · ${item.details}`:""}</p><p className="mt-1 text-xs uppercase text-[#999]">{item.store||"Tienda"}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline"><ExternalLink size={16}/>Ver producto</a></div>)}</div></section></div></main></PublicChrome>;
}
