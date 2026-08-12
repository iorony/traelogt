import vm from "node:vm";
import {NextRequest} from "next/server";
import {describe,expect,it} from "vitest";
import {GET} from "./route";

describe("endpoint del favorito",()=>{
  it("entrega JavaScript ejecutable con el destino solicitado",async()=>{
    const destination="https://traelogt.vercel.app/cotizar";
    const request=new NextRequest(`https://traelogt.vercel.app/api/bookmarklet/script?target=${encodeURIComponent(destination)}`);
    const response=GET(request);
    const script=await response.text();

    expect(response.headers.get("content-type")).toContain("application/javascript");
    expect(script).toContain(destination);
    expect(()=>new vm.Script(script)).not.toThrow();
  });
});
