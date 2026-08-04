"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {Check,LockKeyhole} from "lucide-react";
import {effectivePrice,formatGTQ} from "@/lib/format";
import PublicChrome from "@/components/site-chrome";
import {cartLineKey,cartSubtotal,useCart} from "@/hooks/use-cart";

type OrderResult={orderNumber:string;trackingCode:string;whatsappUrl:string};

export default function Checkout(){
  const [result,setResult]=useState<OrderResult|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [payment,setPayment]=useState("cash_on_delivery");
  const [methods,setMethods]=useState({cash:true,transfer:true});
  const items=useCart(state=>state.items);
  const hydrated=useCart(state=>state.hydrated);
  const clear=useCart(state=>state.clear);
  const subtotal=cartSubtotal(items);

  useEffect(()=>{
    fetch("/api/store-settings")
      .then(response=>response.ok?response.json():Promise.reject())
      .then(data=>{
        setMethods({cash:data.allowCashOnDelivery,transfer:data.allowBankTransfer});
        if(!data.allowCashOnDelivery&&data.allowBankTransfer)setPayment("bank_transfer");
      })
      .catch(()=>{});
  },[]);

  const submit=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();setLoading(true);setError("");
    const form=new FormData(event.currentTarget);
    const body={
      firstName:form.get("firstName"),lastName:form.get("lastName"),phone:form.get("phone"),email:form.get("email"),
      address:form.get("address"),department:form.get("department"),municipality:form.get("municipality"),zone:form.get("zone"),
      reference:form.get("reference"),notes:form.get("notes"),paymentMethod:payment,accepted:form.get("accepted")==="on",
      items:items.map(item=>({productId:item.id,quantity:item.quantity,details:item.details})),
    };
    try{
      const response=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No fue posible crear el pedido");
      clear();setResult(data);
    }catch(reason){setError(reason instanceof Error?reason.message:"Error inesperado")}
    finally{setLoading(false)}
  };

  if(result)return <main className="min-h-screen bg-black text-white grid place-items-center p-5"><div className="max-w-lg text-center"><span className="mx-auto w-16 h-16 bg-[#ff6b00] rounded-full grid place-items-center"><Check size={30}/></span><p className="eyebrow mt-6">Pedido recibido</p><h1 className="text-4xl font-black mt-2">¡Gracias por comprar local!</h1><p className="text-white/70 mt-4">Pedido <strong className="text-white">{result.orderNumber}</strong>. Tu código de rastreo es <strong className="text-white">{result.trackingCode}</strong>.</p><a className="btn btn-primary w-full mt-8" href={result.whatsappUrl} target="_blank" rel="noreferrer">Confirmar por WhatsApp</a><Link href="/rastreo" className="btn border border-white/30 w-full mt-3">Consultar estado</Link></div></main>;
  if(!hydrated)return <PublicChrome announcement="Último paso: confirmá tus datos de entrega"><main className="min-h-screen bg-[#f5f5f3] grid place-items-center"><p className="font-bold">Cargando tu pedido…</p></main></PublicChrome>;

  return <PublicChrome announcement="Último paso: confirmá tus datos de entrega"><main className="bg-[#f5f5f3] min-h-screen py-10"><div className="container"><div className="grid lg:grid-cols-[1fr_400px] gap-8">
    <form onSubmit={submit} className="bg-white rounded-[28px] p-6 md:p-9">
      <p className="eyebrow">Último paso</p><h1 className="text-4xl font-black mt-2 mb-8">Datos de entrega</h1>
      <div className="grid md:grid-cols-2 gap-4"><label>Nombre<input required className="field mt-2" name="firstName"/></label><label>Apellido<input required className="field mt-2" name="lastName"/></label><label>Teléfono<input name="phone" required pattern="[0-9 -]{8,12}" className="field mt-2" placeholder="0000-0000"/></label><label>Correo opcional<input name="email" type="email" className="field mt-2"/></label></div>
      <details className="card mt-8 p-5 group"><summary className="font-black text-lg cursor-pointer flex items-center justify-between">Agregar dirección <span className="text-sm font-normal text-[#777]">Opcional</span></summary><p className="text-sm text-[#666] mt-2">Podés omitirla y confirmar tu ubicación por WhatsApp.</p><div className="grid md:grid-cols-2 gap-4 mt-5"><label className="md:col-span-2">Dirección exacta<input name="address" className="field mt-2"/></label><label>Departamento<input name="department" className="field mt-2"/></label><label>Municipio<input name="municipality" className="field mt-2"/></label><label>Zona opcional<input name="zone" className="field mt-2"/></label><label className="md:col-span-2">Referencia<textarea name="reference" className="field mt-2" rows={3}/></label></div></details>
      <label className="block mt-6">Notas opcionales<textarea name="notes" className="field mt-2" rows={2}/></label>
      <h2 className="text-2xl font-black mt-9 mb-4">Forma de pago</h2>
      <div className="grid md:grid-cols-2 gap-3">{methods.cash&&<label className={`border rounded-2xl p-4 ${payment==="cash_on_delivery"?"border-[#ff6b00] bg-[#fff3ea]":""}`}><input type="radio" value="cash_on_delivery" checked={payment==="cash_on_delivery"} onChange={event=>setPayment(event.target.value)} className="mr-2"/> Contra entrega</label>}{methods.transfer&&<label className={`border rounded-2xl p-4 ${payment==="bank_transfer"?"border-[#ff6b00] bg-[#fff3ea]":""}`}><input type="radio" value="bank_transfer" checked={payment==="bank_transfer"} onChange={event=>setPayment(event.target.value)} className="mr-2"/> Transferencia</label>}</div>
      {!methods.cash&&!methods.transfer&&<p className="bg-amber-50 text-amber-800 p-3 rounded-xl">La tienda no tiene métodos de pago disponibles.</p>}
      <label className="flex gap-3 mt-8 text-sm"><input name="accepted" required type="checkbox"/> He revisado los productos y cantidades de mi pedido.</label>
      {error&&<p className="bg-red-50 text-red-700 p-3 rounded-xl mt-6 text-sm">{error}</p>}
      <button disabled={loading||!items.length||(!methods.cash&&!methods.transfer)} className="btn btn-primary w-full mt-7 disabled:opacity-50"><LockKeyhole size={17}/>{loading?"Creando pedido…":"Crear pedido seguro"}</button>
    </form>
    <aside className="bg-black text-white rounded-[28px] p-7 h-fit"><h2 className="text-2xl font-black">Resumen</h2><div className="space-y-4 mt-6">{items.map(item=><div key={cartLineKey(item)} className="flex justify-between gap-4 text-sm"><span>{item.name}{item.details?` (${item.details})`:""} × {item.quantity}</span><strong>{formatGTQ(effectivePrice(item)*item.quantity)}</strong></div>)}</div><div className="border-t border-white/20 mt-6 pt-5"><div className="flex justify-between text-xl font-bold"><span>Total productos</span><span className="text-[#ff6b00]">{formatGTQ(subtotal)}</span></div><p className="text-sm text-white/65 mt-4">El costo de envío se confirmará por WhatsApp según tu ubicación.</p></div></aside>
  </div></div></main></PublicChrome>;
}
