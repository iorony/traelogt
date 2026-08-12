import {NextResponse} from "next/server";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@/lib/supabase/server";

const schema=z.object({
  firstName:z.string().trim().min(2).max(80),
  lastName:z.string().trim().min(2).max(80),
  phone:z.string().regex(/^\d{4}-?\d{4}$/),
  email:z.string().email().optional().or(z.literal("")),
  address:z.string().trim().max(200).optional().or(z.literal("")),
  notes:z.string().max(1000).optional(),
  items:z.array(z.object({
    store:z.enum(["temu","shein","aliexpress","amazon","other"]),
    url:z.string().url().max(2000),
    name:z.string().trim().min(2).max(250),
    price:z.number().nonnegative().max(1000000),
    currency:z.enum(["USD","MXN","GTQ"]),
    quantity:z.number().int().min(1).max(99),
    details:z.string().max(300),
    image:z.string().url().max(2000).optional().or(z.literal("")),
  })).min(1).max(20),
});

type DbError={code?:string;message?:string};
const missingAddressColumn=(error:DbError|null)=>error?.code==="PGRST204"&&/address/i.test(error.message||"");
const profileForeignKey=(error:DbError|null)=>error?.code==="23503"&&/user_id|profile/i.test(error.message||"");

export async function POST(request:Request){
  try{
    const parsed=schema.safeParse(await request.json());
    if(!parsed.success)return NextResponse.json({error:"Revisa los datos y enlaces ingresados"},{status:400});
    const auth=await createClient(),{data:{user}}=await auth.auth.getUser(),reference=`COT-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`,db=createAdminClient();
    const base={reference,user_id:user?.id??null,first_name:parsed.data.firstName,last_name:parsed.data.lastName,phone:parsed.data.phone.replace(/\D/g,""),email:parsed.data.email||null,notes:parsed.data.notes||null,items:parsed.data.items,status:"pending",department:"Por confirmar",municipality:"Por confirmar"};
    let payload:Record<string,unknown>={...base,address:parsed.data.address||null};
    let result=await db.from("quote_requests").insert(payload);

    // Compatibilidad temporal si producción aún no tiene la migración 017.
    if(missingAddressColumn(result.error)){
      payload=base;
      result=await db.from("quote_requests").insert(payload);
    }
    // Una cuenta OAuth antigua puede existir en auth antes de tener perfil local.
    if(profileForeignKey(result.error)){
      payload={...payload,user_id:null};
      result=await db.from("quote_requests").insert(payload);
    }
    if(result.error)throw result.error;
    return NextResponse.json({reference},{status:201});
  }catch(error){
    const dbError=error as DbError;
    console.error("quote_request_insert_failed",{code:dbError.code,message:dbError.message});
    return NextResponse.json({error:"No fue posible registrar la cotización. Intenta nuevamente; si continúa, comunícate por WhatsApp."},{status:500});
  }
}
