import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function processIncident(text: string): Promise<ExtractedInfo> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: text,
    config: {
      systemInstruction: `Eres un asistente experto en soporte al cliente para Zaprado. 
Tu tarea es clasificar y extraer información de correos electrónicos o formularios de clientes.

Categorías:
- Devolución: El cliente quiere devolver un producto.
- Entrega Fallida: El paquete no ha llegado o hay problemas con el transportista.
- Cambio de Talla: El cliente quiere una talla diferente.
- Facturación: Problemas con pagos, facturas o reembolsos.
- Otro: Cualquier otro tema.

Debes extraer:
1. ID de Pedido (Order ID): Generalmente empieza por # o es una cadena larga de números.
2. Nombre del Producto: Qué artículo menciona.
3. Nombre del Cliente.
4. Motivo: Por qué contacta.

Si falta el ID de Pedido, márcalo como información faltante.
Genera una respuesta sugerida profesional y empática en español siguiendo el estilo de Zaprado (directo, amable, resolutivo).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING, description: "El ID del pedido si se encuentra." },
          productName: { type: Type.STRING, description: "El nombre del producto mencionado." },
          customerName: { type: Type.STRING, description: "El nombre del cliente si se menciona." },
          reason: { type: Type.STRING, description: "El motivo principal de la incidencia." },
          category: { 
            type: Type.STRING, 
            enum: ["Devolución", "Entrega Fallida", "Cambio de Talla", "Facturación", "Otro"],
            description: "La categoría de la incidencia."
          },
          missingInfo: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Lista de datos importantes que faltan (ej: 'ID de pedido')."
          },
          suggestedResponse: { type: Type.STRING, description: "Una respuesta sugerida para el cliente." }
        },
        required: ["category", "missingInfo", "suggestedResponse"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as ExtractedInfo;
  } catch (e) {
    console.error("Error parsing Gemini response", e);
    return {
      category: "Otro",
      missingInfo: ["Error al procesar"],
      suggestedResponse: "Lo sentimos, ha habido un error al procesar tu solicitud. Un agente se pondrá en contacto contigo pronto."
    };
  }
}
