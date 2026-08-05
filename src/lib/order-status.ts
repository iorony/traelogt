export const orderStatus = {
  pending_confirmation: { label: "Pendiente de confirmación", message: "Recibimos tu pedido y estamos confirmando disponibilidad." },
  pending_payment: { label: "Pendiente de pago", message: "Tu pedido está pendiente de pago." },
  payment_review: { label: "Pago en revisión", message: "Estamos verificando la información de tu pago." },
  confirmed: { label: "Pedido confirmado", message: "Tu pedido fue confirmado correctamente." },
  preparing: { label: "En preparación", message: "Estamos preparando los productos de tu pedido." },
  packed: { label: "Pedido empacado", message: "Tu pedido está empacado y listo para ser enviado." },
  shipped: { label: "En camino", message: "Tu pedido fue enviado y se encuentra en camino." },
  delivered: { label: "Entregado", message: "Tu pedido fue entregado. ¡Gracias por tu compra!" },
  cancelled: { label: "Cancelado", message: "El pedido fue cancelado." },
  rejected: { label: "Rechazado", message: "El pedido no pudo ser confirmado." },
  returned: { label: "Devuelto", message: "El pedido fue marcado como devuelto." },
} as const;

export type OrderStatus = keyof typeof orderStatus;

export function statusLabel(status: string) {
  return orderStatus[status as OrderStatus]?.label ?? status.replaceAll("_", " ");
}

export function defaultStatusMessage(status: OrderStatus) {
  return orderStatus[status].message;
}
