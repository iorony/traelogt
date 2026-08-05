import {describe,expect,it} from "vitest";
import {checkoutSchema,trackingSchema} from "./validation";

const validCheckout={firstName:"Ana",lastName:"López",phone:"5555-5555",email:"",address:"Zona 1, Guatemala",department:"Guatemala",municipality:"Guatemala",zone:"1",reference:"Casa azul",notes:"",paymentMethod:"cash_on_delivery" as const,accepted:true as const,items:[{productId:"550e8400-e29b-41d4-a716-446655440000",quantity:1,details:"Negro, talla M"}]};

describe("checkoutSchema",()=>{
  it("acepta color, talla o variante por línea",()=>{const result=checkoutSchema.safeParse(validCheckout);expect(result.success).toBe(true);if(result.success)expect(result.data.items[0].details).toBe("Negro, talla M")});
  it("rechaza detalles excesivos",()=>{expect(checkoutSchema.safeParse({...validCheckout,items:[{...validCheckout.items[0],details:"x".repeat(161)}]}).success).toBe(false)});
  it("no permite pedidos vacíos",()=>{expect(checkoutSchema.safeParse({...validCheckout,items:[]}).success).toBe(false)});
  it("permite confirmar la dirección después por WhatsApp",()=>{expect(checkoutSchema.safeParse({...validCheckout,address:"",department:"",municipality:"",reference:""}).success).toBe(true)});
});

describe("trackingSchema",()=>{
  it("acepta un código de rastreo GT",()=>expect(trackingSchema.safeParse({trackingCode:"GT-8F4K2M9Q",phone:"4290-2957"}).success).toBe(true));
  it("acepta un número de pedido PED",()=>expect(trackingSchema.safeParse({trackingCode:"ped-2026-000007",phone:"4290-2957"}).success).toBe(true));
  it("rechaza identificadores incompletos",()=>expect(trackingSchema.safeParse({trackingCode:"PED-7",phone:"4290-2957"}).success).toBe(false));
});
