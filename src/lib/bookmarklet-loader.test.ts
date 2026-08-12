import {describe,expect,it} from "vitest";
import {makeBookmarkletLoader} from "./bookmarklet-loader";
import vm from "node:vm";

describe("cargador dinámico",()=>{
  it("carga el endpoint de Tráelo GT con cache-buster y destino",()=>{const code=makeBookmarkletLoader("https://traelo.example","http://localhost:3000/cotizar");expect(code).toContain("https://traelo.example/api/bookmarklet/script?target=");expect(code).toContain("Date.now()");expect(code).toContain(encodeURIComponent("http://localhost:3000/cotizar"))});
  it("informa cuando el script remoto no carga",()=>{expect(makeBookmarkletLoader("https://traelo.example","https://traelo.example/cotizar")).toContain("s.onerror")});
  it("genera un cargador ejecutable",()=>{const code=makeBookmarkletLoader("https://traelo.example","https://traelo.example/cotizar");expect(()=>new vm.Script(code.slice("javascript:".length))).not.toThrow()});
});
