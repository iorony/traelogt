import Link from "next/link";
import {notFound} from "next/navigation";
import {ChevronLeft,ExternalLink,MessageCircle} from "lucide-react";
import {requireStaff} from "@/lib/authz";
import {createAdminClient} from "@/lib/supabase/admin";
import {formatGTQ} from "@/lib/format";
import {StatusBadge,statusPresentation} from "@/components/admin-status";
import {updateQuote} from "@/app/admin/quote-actions";

type QuoteItem={store?:string;url:string;name?:string;price?:number;currency?:string;quantity:number;details?:string};

const nextStates:Record<string,{value:string;label:string}[]>={
  pending:[{value:"reviewing",label:"Iniciar revisión"},{value:"rejected",label:"Rechazar"}],
  reviewing:[{value:"quoted",label:"Enviar cotización"},{value:"rejected",label:"Rechazar"}],
  quoted:[{value:"approved",label:"Marcar aprobada"},{value:"rejected",label:"Rechazar"},{value:"cancelled",label:"Cancelar"}],
  approved:[{value:"purchased",label:"Marcar comprada"},{value:"cancelled",label:"Cancelar"}],
  purchased:[{value:"completed",label:"Marcar completada"},{value:"cancelled",label:"Cancelar"}],
};

export default async function QuoteDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string;updated?:string}>}){
  await requireStaff();
  const {id}=await params,feedback=await searchParams,db=createAdminClient();
  const {data:quote}=await db.from("quote_requests").select("*").eq("id",id).single();
  if(!quote)notFound();
  const badge=statusPresentation(quote.status),items=(Array.isArray(quote.items)?quote.items:[]) as QuoteItem[],options=nextStates[quote.status]??[],phone=String(quote.phone).replace(/\D/g,""),message=encodeURIComponent(`Hola ${quote.first_name}, te contactamos de Tráelo GT por tu cotización ${quote.reference}.`);

  return <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-4xl">
    <Link href="/admin/cotizaciones" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[#777] hover:text-[#d95700]"><ChevronLeft size={16}/>Cotizaciones</Link>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black sm:text-3xl">{quote.reference}</h1><p className="mt-1 text-sm text-[#777]">Solicitada el {new Date(quote.created_at).toLocaleString("es-GT",{dateStyle:"long",timeStyle:"short"})}</p></div><StatusBadge tone={badge.tone}>{badge.label}</StatusBadge></div>
    {feedback.updated&&<p className="mb-4 rounded-xl bg-green-50 p-4 text-green-800">Cotización actualizada.</p>}
    {feedback.error&&<p className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{feedback.error}</p>}
    <div className="grid gap-5 md:grid-cols-2">
      <section className="card p-5"><h2 className="font-bold">Datos del cliente</h2><dl className="mt-4 space-y-2 text-sm"><Row label="Nombre" value={`${quote.first_name} ${quote.last_name}`}/><Row label="Teléfono" value={quote.phone}/><Row label="Correo" value={quote.email||"—"}/><Row label="Dirección" value={quote.address||"Por confirmar"}/><Row label="Comentarios" value={quote.notes||"—"}/></dl><a href={`https://wa.me/${phone.startsWith("502")?phone:`502${phone}`}?text=${message}`} target="_blank" rel="noreferrer" className="btn btn-outline mt-5 w-full"><MessageCircle size={17}/>Contactar por WhatsApp</a></section>
      <section className="card p-5"><h2 className="font-bold">Resumen</h2><dl className="mt-4 space-y-2 text-sm"><Row label="Precio Guatemala" value={quote.final_price_guatemala==null?"Pendiente":formatGTQ(Number(quote.final_price_guatemala))}/><Row label="Respuesta cliente" value={String(quote.customer_response??"pending").replaceAll("_"," ")}/><Row label="Cotizada" value={quote.quoted_at?new Date(quote.quoted_at).toLocaleString("es-GT"):"—"}/><Row label="Notas internas" value={quote.admin_notes||"—"}/></dl></section>
    </div>
    <section className="card mt-5"><div className="border-b border-[#ededeb] px-5 py-4"><h2 className="font-bold">Productos solicitados</h2></div><div className="divide-y divide-[#ededeb]">{items.map((item,index)=><div key={`${item.url}-${index}`} className="flex items-start justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="font-medium">Producto {index+1}</p><p className="text-sm text-[#777]">Cantidad: {item.quantity}{item.details?` · ${item.details}`:""}</p></div><a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg p-2 text-[#d95700] hover:bg-[#fff0e5]" aria-label="Abrir enlace"><ExternalLink size={17}/></a></div>)}</div></section>
    {options.length>0&&<form action={updateQuote} className="card mt-5 grid gap-4 p-5 sm:grid-cols-2"><input type="hidden" name="quoteId" value={quote.id}/><div className="sm:col-span-2"><h2 className="font-bold">Gestionar cotización</h2><p className="text-sm text-[#777]">Asigna el precio y avanza el estado de la solicitud.</p></div><label className="text-sm font-medium">Siguiente estado<select name="status" required className="field mt-1.5">{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="text-sm font-medium">Precio final en Guatemala<input name="finalPrice" type="number" min="0" step="0.01" defaultValue={quote.final_price_guatemala??""} className="field mt-1.5"/></label><label className="text-sm font-medium sm:col-span-2">Notas internas<textarea name="adminNotes" defaultValue={quote.admin_notes??""} maxLength={1000} rows={3} className="field mt-1.5"/></label><button className="btn btn-primary sm:col-span-2">Guardar actualización</button></form>}
  </div></main>;
}

function Row({label,value}:{label:string;value:string}){return <div className="flex justify-between gap-4"><dt className="text-[#777]">{label}</dt><dd className="text-right capitalize">{value}</dd></div>}
