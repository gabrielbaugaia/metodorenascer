import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Render app first for faster initial paint
createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker after initial render (non-blocking)
if ("serviceWorker" in navigator) {
  // Use requestIdleCallback for better performance, fallback to setTimeout
  const registerSW = () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log("[SW] Registrado com sucesso:", registration.scope);
      },
      (error) => {
        console.error("[SW] Falha ao registrar:", error);
      }
    );
  };
  
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(registerSW);
  } else {
    setTimeout(registerSW, 1000);
  }
}
