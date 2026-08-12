import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(){
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({authenticated:false,count:0,latest:null});
  const [orders,quotes]=await Promise.all([
    db.from("orders").select("updated_at").eq("customer_id",user.id).order("updated_at",{ascending:false}).limit(1),
    db.from("quote_requests").select("updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1),
  ]);
  const dates=[orders.data?.[0]?.updated_at,quotes.data?.[0]?.updated_at].filter(Boolean) as string[],latest=dates.sort((a,b)=>b.localeCompare(a))[0]??null;
  const [orderCount,quoteCount]=await Promise.all([
    db.from("orders").select("id",{count:"exact",head:true}).eq("customer_id",user.id),
    db.from("quote_requests").select("id",{count:"exact",head:true}).eq("user_id",user.id),
  ]);
  return NextResponse.json({authenticated:true,userId:user.id,count:(orderCount.count??0)+(quoteCount.count??0),latest},{headers:{"cache-control":"no-store"}});
}
