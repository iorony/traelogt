import {describe,expect,it} from "vitest";
import {makeTemuCompatibleBookmarklet} from "./product-bookmarklet-temu";
import vm from "node:vm";

describe("favorito de productos",()=>{
  const script=makeTemuCompatibleBookmarklet("https://traelo.example/cotizar");
  it("navega en la misma pestaña",()=>{expect(script).toContain("location.assign('https://traelo.example/cotizar?'");expect(script).not.toContain("target=open(")});
  it("prioriza monedas visibles por tienda",()=>{expect(script).toContain("store==='temu'");expect(script).toContain("store==='shein'");expect(script).toContain("store==='aliexpress'");expect(script).toContain("score:300");expect(script).toContain("MXN\\s*\\$?")});
  it("lee variantes activas de SHEIN",()=>{expect(script).toContain("sku-item_active");expect(script).toContain("product-intro__head-sku")});
  it("genera JavaScript ejecutable",()=>{expect(script.startsWith("javascript:")).toBe(true);try{new vm.Script(script.slice("javascript:".length))}catch(error){console.error(error);throw error}});
  it("extrae automáticamente sin pedir precio ni moneda",()=>{expect(script).not.toContain("prompt(");expect(script).toContain("Precio: '+price");expect(script).toContain("Number(price)>1000000")});
});
