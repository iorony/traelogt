import StoreHome from "@/components/store";import {getPublicProducts} from "@/lib/public-products";
export const dynamic="force-dynamic";
export default async function Page(){const products=await getPublicProducts();return <StoreHome products={products.slice(0,8)}/>}
