import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for Triage
  app.post("/api/triage", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

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

      const resultText = response.text || "{}";
      res.json(JSON.parse(resultText));
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ 
        error: "Failed to process incident",
        category: "Otro",
        missingInfo: ["Error del sistema"],
        suggestedResponse: "Lo sentimos, ha habido un error al procesar tu solicitud. Un agente se pondrá en contacto contigo pronto."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
