"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { formatGTQ } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const [selectedId, setSelectedId] = useState("");
  const [added, setAdded] = useState(false);
  const addProduct = useCart((state) => state.addProduct);
  const selected = variants.find((variant) => variant.id === selectedId);
  const available = selected ? selected.stock - selected.reserved_stock : hasVariants ? 0 : product.stock;
  const selectedPrice = selected?.price ?? product.sale_price ?? product.price;

  const add = () => {
    if (hasVariants && !selected) return;
    addProduct({ ...product, price: selectedPrice, sale_price: null, stock: available }, selected?.name ?? "", 1, selected?.id);
    setAdded(true);
  };

  return <div className="grid gap-3">
    {hasVariants && <label className="text-sm font-bold">Talla, color o variante
      <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setAdded(false); }} required className="field mt-2 font-normal">
        <option value="">Selecciona una opción</option>
        {variants.map((variant) => {
          const stock = variant.stock - variant.reserved_stock;
          const price = variant.price ?? product.sale_price ?? product.price;
          return <option key={variant.id} value={variant.id} disabled={stock <= 0}>{variant.name} · {formatGTQ(price)} {stock <= 0 ? "(agotado)" : `(${stock} disponibles)`}</option>;
        })}
      </select>
    </label>}
    {selected && <p className="text-lg font-black">Precio: {formatGTQ(selectedPrice)}</p>}
    <button onClick={add} disabled={!available || (hasVariants && !selected)} className="btn btn-primary w-full disabled:opacity-40 md:w-auto">
      <ShoppingBag size={18}/>{!available ? (hasVariants && !selected ? "Selecciona una opción" : "Producto agotado") : added ? "Agregado al carrito" : "Agregar al carrito"}
    </button>
  </div>;
}
