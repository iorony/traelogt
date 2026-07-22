export const formatGTQ=(value:number)=>new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ",minimumFractionDigits:2}).format(value).replace("GTQ","Q");
export const effectivePrice=(p:{price:number;sale_price:number|null})=>p.sale_price ?? p.price;
