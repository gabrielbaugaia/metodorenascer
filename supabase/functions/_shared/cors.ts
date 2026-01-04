// Shared CORS configuration for all edge functions
// Usage: import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

export const allowedOrigins = [
  "https://lxdosmjenbaugmhyfanx.lovableproject.com",
  "https://metodorenascer.lovable.app",
  "https://renascerapp.com.br",
  "http://localhost:5173",
  "http://localhost:8080",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

// Error messages that are safe to expose to users
export function mapErrorToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes("not found")) {
      return "Recurso não encontrado";
    }
    if (message.includes("unauthorized") || message.includes("auth")) {
      return "Não autorizado. Faça login novamente.";
    }
    if (message.includes("rate limit") || message.includes("429")) {
      return "Muitas requisições. Aguarde alguns minutos.";
    }
    if (message.includes("timeout")) {
      return "A requisição demorou muito. Tente novamente.";
    }
  }
  
  return "Ocorreu um erro. Tente novamente.";
}

// Create error response with CORS headers
export function createErrorResponse(
  req: Request,
  message: string,
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    }
  );
}

// Create success response with CORS headers
export function createSuccessResponse(
  req: Request,
  data: unknown,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    }
  );
}
