export type SupportedCurrency="USD"|"MXN"|"GTQ";

export function parseMoney(value:unknown){
  if(typeof value==="number")return Number.isFinite(value)?value:undefined;
  if(typeof value!=="string")return undefined;
  const found=value.replace(/\s/g,"").match(/\d[\d.,]*/)?.[0];
  if(!found)return undefined;
  const comma=found.lastIndexOf(","),dot=found.lastIndexOf(".");
  let normalized=found;
  if(comma>=0&&dot>=0)normalized=comma>dot?found.replace(/\./g,"").replace(",","."):found.replace(/,/g,"");
  else if(comma>=0)normalized=/,\d{1,2}$/.test(found)?found.replace(",","."):found.replace(/,/g,"");
  else if((found.match(/\./g)||[]).length>1)normalized=found.replace(/\./g,"");
  const result=Number(normalized);
  return Number.isFinite(result)?result:undefined;
}

export function detectCurrency(value:string,host:string,fallback?:string):SupportedCurrency{
  const text=value.toUpperCase().replace(/\s/g,"");
  if(/(?:^|[^A-Z])Q\d/.test(text)||text.includes("GTQ"))return "GTQ";
  if(text.includes("MX$")||text.includes("MXN$")||text.includes("MXN"))return "MXN";
  if(text.includes("US$")||text.includes("USD"))return "USD";
  const normalizedFallback=fallback?.toUpperCase();
  if(normalizedFallback==="USD"||normalizedFallback==="MXN"||normalizedFallback==="GTQ")return normalizedFallback;
  if(host.includes("amazon.com")||host.includes("aliexpress.com"))return "USD";
  return "MXN";
}
