export type ProductVariant={id:string;name:string;price:number|null;stock:number;reserved_stock:number};
export type Product = { id:string; sku:string; name:string; slug:string; short_description:string|null; description:string|null; price:number; sale_price:number|null; stock:number; minimum_stock:number; status:"draft"|"active"|"inactive"|"out_of_stock"; featured:boolean; main_image_url:string|null; images?:{url:string;alt:string|null}[]; variants?:ProductVariant[]; category?:{name:string}|null };
export type CartItem = Pick<Product,"id"|"name"|"slug"|"price"|"sale_price"|"stock"|"main_image_url"> & {
  quantity:number;
  /** Talla, color u otra variante elegida para esta línea. */
  details?:string;
  variantId?:string;
};
