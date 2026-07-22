import {CheckCircle2,XCircle} from "lucide-react";
import {requireStaff} from "@/lib/authz";
import {createAdminClient} from "@/lib/supabase/admin";
import {formatGTQ} from "@/lib/format";
import {updateOrderDecision} from "@/app/admin/actions";

const labels:Record<string,string>={pending_confirmation:"Pendiente de confirmación",pending_payment:"Pendiente de pago",payment_review:"Pago en revisión",confirmed:"Confirmado",preparing:"En preparación",packed:"Empacado",shipped:"Enviado",delivered:"Entregado",cancelled:"Cancelado",rejected:"Rechazado",returned:"Devuelto"};
const paymentLabels:Record<string,string>={cash_on_delivery:"Contra entrega",bank_transfer:"Transferencia bancaria"};

function Actions({id,status,paymentMethod}:{id:string;status:string;paymentMethod:string}){
  const canReject=["pending_confirmation","pending_payment","payment_review"].includes(status);
  const canConfirm=status==="pending_confirmation"||(status==="payment_review"&&paymentMethod==="bank_transfer");
  if(!canReject&&!canConfirm)return null;
  return <div className="flex flex-wrap gap-2 mt-3">
    {canConfirm&&<form action={updateOrderDecision}><input type="hidden" name="orderId" value={id}/><input type="hidden" name="decision" value="confirmed"/><button className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 text-white px-3 py-2 text-xs font-bold"><CheckCircle2 size={15}/> Confirmar</button></form>}
    {canReject&&<form action={updateOrderDecision} className="flex gap-2"><input type="hidden" name="orderId" value={id}/><input type="hidden" name="decision" value="rejected"/><input name="comment" maxLength={500} placeholder="Motivo opcional" className="field !py-2 !text-xs min-w-[150px]"/><button className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 text-white px-3 py-2 text-xs font-bold"><XCircle size={15}/> Rechazar</button></form>}
  </div>;
}

export default async function Pedidos(){
  await requireStaff();
  const db=createAdminClient();
  const {data}=await db.from("orders").select("id,order_number,buyer_first_name,buyer_last_name,phone,total,payment_method,status,created_at").order("created_at",{ascending:false}).limit(100);
  const orders=data??[];
  return <main className="p-4 sm:p-5 md:p-9"><p className="eyebrow">Operación</p><h1 className="text-4xl font-black mt-2">Pedidos</h1><p className="text-[#666] mt-3 max-w-3xl">Confirmá los pedidos contra entrega cuando los datos estén completos. En transferencias, la confirmación se habilita únicamente cuando el pago esté en revisión. También podés rechazar solicitudes pendientes e indicar un motivo.</p>
  <div className="hidden md:block card overflow-x-auto mt-8"><table className="w-full text-sm text-left"><thead className="bg-black text-white"><tr>{["Pedido","Cliente","Teléfono","Total","Pago","Estado","Acciones"].map(x=><th className="p-4" key={x}>{x}</th>)}</tr></thead><tbody>{orders.map(o=><tr className="border-b align-top" key={o.id}><td className="p-4 font-bold">{o.order_number}</td><td className="p-4">{o.buyer_first_name} {o.buyer_last_name}</td><td className="p-4">{o.phone}</td><td className="p-4">{formatGTQ(Number(o.total))}</td><td className="p-4">{paymentLabels[o.payment_method]??o.payment_method}</td><td className="p-4"><span className="chip">{labels[o.status]??o.status}</span></td><td className="p-4 min-w-[300px]"><Actions id={o.id} status={o.status} paymentMethod={o.payment_method}/></td></tr>)}</tbody></table></div>
  <div className="md:hidden grid gap-3 mt-6">{orders.map(o=><article className="card p-4" key={o.id}><div className="flex justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-[#777]">Pedido</p><strong>{o.order_number}</strong></div><span className="chip h-fit">{labels[o.status]??o.status}</span></div><h2 className="font-bold mt-4">{o.buyer_first_name} {o.buyer_last_name}</h2><a href={`tel:${o.phone}`} className="text-sm text-[#666]">{o.phone}</a><div className="grid grid-cols-2 gap-3 border-t mt-4 pt-4"><div><p className="text-[10px] uppercase text-[#777]">Total</p><strong>{formatGTQ(Number(o.total))}</strong></div><div><p className="text-[10px] uppercase text-[#777]">Método de pago</p><span className="text-sm">{paymentLabels[o.payment_method]??o.payment_method}</span></div></div><Actions id={o.id} status={o.status} paymentMethod={o.payment_method}/></article>)}</div>
  {!orders.length&&<div className="card p-10 text-center text-[#777] mt-8">No hay pedidos registrados.</div>}</main>;
}
