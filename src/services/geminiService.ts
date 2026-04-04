import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getCustomerAiSupport(message: string, ticketContext: any) {
  try {
    // Specific requirement: If asking for customer care number
    if (message.toLowerCase().includes("send customer care number")) {
      return "+917338338221";
    }

    const prompt = `
      You are an AI assistant for Tic-Solver, a customer support ticketing system.
      You are helping a CUSTOMER who has raised a ticket.
      
      Ticket Context:
      Ticket Number: ${ticketContext.ticketNumber}
      Type: ${ticketContext.type}
      Status: ${ticketContext.status}
      Reason: ${ticketContext.details.reason}
      Return Status: ${ticketContext.details?.returnStatus || 'N/A'}
      
      Customer Message: "${message}"
      
      Instructions:
      1. Be empathetic and professional.
      2. If the customer asks for the "Customer Care Number", ALWAYS respond with ONLY "+917338338221".
      3. Provide real-time information about their "Product Return status" and "Track My Tickets" based on the context provided.
      4. If return status is 'pending_pickup', tell them a delivery boy will pick it up soon.
      5. If return status is 'product_received', tell them the product is in transit to the admin.
      6. If return status is 'returned_successfully', confirm that the return is complete and payment is being processed.
      7. Keep responses concise and helpful.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    if (!response || !response.text) {
      console.warn("Gemini API returned an empty response.");
      return "I'm here to help, but I'm having trouble connecting right now. Please try again.";
    }

    return response.text;
  } catch (error: any) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: { ticketNumber: ticketContext.ticketNumber, type: ticketContext.type }
    };
    console.error("Gemini API Error Details:", JSON.stringify(errorDetails, null, 2));
    
    if (error.message?.includes("API key not valid")) {
      return "I'm having trouble with my API key. Please contact an admin.";
    }
    
    if (error.message?.includes("quota")) {
      return "I'm a bit overwhelmed right now. Please try again in a few minutes.";
    }

    return "I'm here to help, but I'm having trouble connecting right now. Please try again or wait for an admin response.";
  }
}
