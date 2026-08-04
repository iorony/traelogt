import {createClient} from "@/lib/supabase/server";
import {Product} from "@/lib/types";

function normalize(row:Record<string,unknown>):Product{
  const relation=row.category;
  const category=Array.isArray(relation)?relation[0]:relation;
  return {...row,price:Number(row.price),sale_price:row.sale_price===null?null:Number(row.sale_price),stock:Number(row.stock),minimum_stock:Number(row.minimum_stock),category:category as {name:string}|null} as Product;
}

export async function getPublicProducts(filters?:{categorySlug?:string;search?:string}):Promise<Product[]>{
  const db=await createClient();
  const categoryRelation=filters?.categorySlug?"category:categories!inner(name,slug)":"category:categories(name,slug)";
  let query=db.from("products").select(`id,sku,name,slug,short_description,price,sale_price,stock,minimum_stock,status,featured,main_image_url,product_images(path,alt_text,display_order),${categoryRelation}`).eq("is_active",true).eq("status","active").is("deleted_at",null);
  if(filters?.categorySlug)query=query.eq("category.slug",filters.categorySlug);
  if(filters?.search)query=query.ilike("name",`%${filters.search}%`);
  const {data,error}=await query.order("featured",{ascending:false}).order("created_at",{ascending:false});
  if(error){console.error("No se pudo consultar el catálogo público:",error.message);return []}
  return (data??[]).map(row=>{const raw=row as unknown as Record<string,unknown>;const product=normalize(raw);const images=(Array.isArray(raw.product_images)?raw.product_images:[]) as {path:string;alt_text:string|null;display_order:number}[];product.images=images.sort((a,b)=>a.display_order-b.display_order).map(image=>({url:db.storage.from("product-images").getPublicUrl(image.path).data.publicUrl,alt:image.alt_text}));return product});
}

export async function getPublicProduct(slug:string){const products=await getPublicProducts();return products.find(product=>product.slug===slug)}

export async function getPublicCategories(){
  const db=await createClient();
  const {data,error}=await db.from("categories").select("id,name,slug").eq("is_active",true).order("display_order").order("name");
  if(error){console.error("No se pudieron consultar las categorías:",error.message);return []}
  return data??[];
}
