import {createClient} from "@/lib/supabase/server";
import {Product} from "@/lib/types";

function normalize(row:Record<string,unknown>):Product{
  const relation=row.category;
  const category=Array.isArray(relation)?relation[0]:relation;
  return {...row,price:Number(row.price),sale_price:row.sale_price===null?null:Number(row.sale_price),stock:Number(row.stock),minimum_stock:Number(row.minimum_stock),category:category as {name:string}|null} as Product;
}

export async function getPublicProducts():Promise<Product[]>{
  const db=await createClient();
  const {data,error}=await db.from("products").select("id,sku,name,slug,short_description,price,sale_price,stock,minimum_stock,status,featured,main_image_url,category:categories(name)").eq("is_active",true).eq("status","active").is("deleted_at",null).order("featured",{ascending:false}).order("created_at",{ascending:false});
  if(error){console.error("No se pudo consultar el catálogo público:",error.message);return []}
  return (data??[]).map(row=>normalize(row as unknown as Record<string,unknown>));
}

export async function getPublicProduct(slug:string){const products=await getPublicProducts();return products.find(product=>product.slug===slug)}
