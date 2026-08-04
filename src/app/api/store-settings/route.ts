import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";

export async function GET(){
  const db=createAdminClient();
  const {data,error}=await db.from("store_settings").select("shipping_cost,allow_cash_on_delivery,allow_bank_transfer").eq("id",true).single();
  if(error)return NextResponse.json({error:"No fue posible consultar la configuración"},{status:500});
  return NextResponse.json({
    shippingCost:Number(data.shipping_cost),
    allowCashOnDelivery:Boolean(data.allow_cash_on_delivery),
    allowBankTransfer:Boolean(data.allow_bank_transfer),
  });
}
