"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";

const feedback=(type:"error"|"message",value:string)=>`/mi-cuenta?${type}=${encodeURIComponent(value)}`;
const schema=z.object({
  identifier:z.string().trim().toUpperCase().regex(/^(?:PED-\d{4}-\d+|COT-\d{4}-[A-Z0-9]+|GT-[A-Z0-9-]+)$/,"Ingresa una referencia PED, COT o un código GT válido"),
  phone:z.string().transform(value=>value.replace(/\D/g,"")).refine(value=>value.length===8,"Ingresa un teléfono de 8 dígitos"),
});

export async function linkOrder(formData:FormData){
  const parsed=schema.safeParse({identifier:String(formData.get("orderIdentifier")||""),phone:String(formData.get("orderPhone")||"")});
  if(!parsed.success)redirect(feedback("error",parsed.error.issues[0]?.message||"Revisa la referencia y el teléfono"));
  const auth=await createClient(),{data:{user}}=await auth.auth.getUser();
  if(!user)redirect("/login");
  const admin=createAdminClient(),{identifier,phone}=parsed.data;

  if(identifier.startsWith("COT-")){
    const {data:quote,error}=await admin.from("quote_requests").select("id,user_id").eq("reference",identifier).eq("phone",phone).maybeSingle();
    if(error||!quote)redirect(feedback("error","No encontramos una cotización con esa referencia y teléfono"));
    if(quote.user_id&&quote.user_id!==user.id)redirect(feedback("error","Esta cotización ya está asociada a otra cuenta"));
    if(quote.user_id===user.id)redirect(feedback("message","La cotización ya estaba asociada a tu cuenta"));
    const {data:linked,error:updateError}=await admin.from("quote_requests").update({user_id:user.id,updated_at:new Date().toISOString()}).eq("id",quote.id).is("user_id",null).select("id").maybeSingle();
    if(updateError||!linked)redirect(feedback("error","No fue posible asociar la cotización"));
    await admin.from("audit_logs").insert({user_id:user.id,action:"customer_link_quote",module:"quotes",record_id:quote.id,new_data:{identifier}});
    revalidatePath("/mi-cuenta");
    redirect(feedback("message","Cotización asociada correctamente"));
  }

  let query=admin.from("orders").select("id,customer_id").eq("phone",phone);
  query=identifier.startsWith("PED-")?query.eq("order_number",identifier):query.eq("tracking_code",identifier);
  const {data:order,error}=await query.maybeSingle();
  if(error||!order)redirect(feedback("error","No encontramos un pedido con esa referencia y teléfono"));
  if(order.customer_id&&order.customer_id!==user.id)redirect(feedback("error","Este pedido ya está asociado a otra cuenta"));
  if(order.customer_id===user.id)redirect(feedback("message","El pedido ya estaba asociado a tu cuenta"));
  const {data:linked,error:updateError}=await admin.from("orders").update({customer_id:user.id,is_guest:false,updated_at:new Date().toISOString()}).eq("id",order.id).is("customer_id",null).select("id").maybeSingle();
  if(updateError||!linked)redirect(feedback("error","No fue posible asociar el pedido"));
  await admin.from("audit_logs").insert({user_id:user.id,action:"customer_link_order",module:"orders",record_id:order.id,new_data:{identifier}});
  revalidatePath("/mi-cuenta");
  redirect(feedback("message","Pedido asociado correctamente"));
}
