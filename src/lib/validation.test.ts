import {describe,expect,it} from "vitest";
import {checkoutSchema} from "./validation";

const validCheckout={firstName:"Ana",lastName:"López",phone:"5555-5555",email:"",address:"Zona 1, Guatemala",department:"Guatemala",municipality:"Guatemala",zone:"1",reference:"Casa azul",notes:"",paymentMethod:"cash_on_delivery" as const,accepted:true as const,items:[{productId:"550e8400-e29b-41d4-a716-446655440000",quantity:1,details:"Negro, talla M"}]};

describe("checkoutSchema",()=>{
  it("acepta color, talla o variante por línea",()=>{const result=checkoutSchema.safeParse(validCheckout);expect(result.success).toBe(true);if(result.success)expect(result.data.items[0].details).toBe("Negro, talla M")});
  it("rechaza detalles excesivos",()=>{expect(checkoutSchema.safeParse({...validCheckout,items:[{...validCheckout.items[0],details:"x".repeat(161)}]}).success).toBe(false)});
  it("no permite pedidos vacíos",()=>{expect(checkoutSchema.safeParse({...validCheckout,items:[]}).success).toBe(false)});
  it("permite confirmar la dirección después por WhatsApp",()=>{expect(checkoutSchema.safeParse({...validCheckout,address:"",department:"",municipality:"",reference:""}).success).toBe(true)});
});
