"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {z} from "zod";import {requireStaff} from "@/lib/authz";import {createAdminClient} from "@/lib/supabase/admin";
const uuid=z.string().uuid();
const withError=(message:string)=>redirect(`/admin/inventario?error=${encodeURIComponent(message)}`);
export async function adjustStock(formData:FormData){
 const staff=await requireStaff();
 const productId=uuid.parse(formData.get("productId"));
 const changeRaw=Number(formData.get("change"));
 const reason=String(formData.get("reason")||"").trim();
 if(!Number.isInteger(changeRaw)||changeRaw===0)return withError("La cantidad debe ser un número entero distinto de 0");
 if(reason.length<3)return withError("Indicá un motivo para el ajuste");
 const db=createAdminClient();
 const {data:product,error:productError}=await db.from("products").select("stock,minimum_stock,status").eq("id",productId).single();
 if(productError||!product)return withError("No se encontró el producto");
 const resulting=product.stock+changeRaw;
 if(resulting<0)return withError("El ajuste dejaría existencias negativas");
 const {error:updateError}=await db.from("products").update({stock:resulting,status:resulting>0&&product.status==="out_of_stock"?"active":product.status,updated_by:staff.userId}).eq("id",productId);
 if(updateError)return withError("No se pudo actualizar el inventario");
 await db.from("inventory_movements").insert({product_id:productId,previous_quantity:product.stock,quantity_change:changeRaw,resulting_quantity:resulting,movement_type:changeRaw>0?"manual_increase":"manual_decrease",reason,responsible_user:staff.userId});
 await db.from("audit_logs").insert({user_id:staff.userId,action:"adjust_stock",module:"inventory",record_id:productId,new_data:{change:changeRaw,resulting,reason}});
 revalidatePath("/admin/inventario");revalidatePath("/admin/movimientos");revalidatePath("/admin/productos");revalidatePath("/admin/supervisores");revalidatePath("/productos");revalidatePath("/")
}
