export type IncidentCategory = "Devolución" | "Entrega Fallida" | "Cambio de Talla" | "Facturación" | "Otro";

export interface ExtractedInfo {
  orderId?: string;
  productName?: string;
  customerName?: string;
  reason?: string;
  category: IncidentCategory;
  missingInfo: string[];
  suggestedResponse: string;
}
