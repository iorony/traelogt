"use client";
import {Trash2} from "lucide-react";import {deleteProduct} from "@/app/admin/product-actions";
export default function DeleteProductButton({productId,productName}:{productId:string;productName:string}){
 return <form action={deleteProduct} onSubmit={e=>{if(!confirm(`¿Eliminar "${productName}"? Esta acción lo quita del catálogo y no se puede deshacer desde aquí.`))e.preventDefault()}}>
  <input type="hidden" name="productId" value={productId}/>
  <button className="text-red-700 font-bold flex items-center gap-1"><Trash2 size={15}/> Eliminar</button>
 </form>}
