import {describe,expect,it} from "vitest";
import {detectCurrency,parseMoney} from "./money";

describe("parseMoney",()=>{
  it.each([["Q92.76",92.76],["MX$1,299.90",1299.9],["MXN$78.00",78],["78.00 $MXN",78],["US $31.54",31.54],["$1,249.00",1249],["MX$1.299,90",1299.9]])("interpreta %s",(input,expected)=>expect(parseMoney(input)).toBe(expected));
});
describe("detectCurrency",()=>{
  it.each([["Q92.76","www.temu.com","GTQ"],["MX$92.76","www.temu.com","MXN"],["MXN$78.001","shein.com.mx","MXN"],["US $31.54","es.aliexpress.com","USD"],["$19.99","amazon.com","USD"],["$299.00","shein.com.mx","MXN"]])("detecta moneda de %s",(price,host,expected)=>expect(detectCurrency(price,host)).toBe(expected));
});
