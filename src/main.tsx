import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registrar Service Worker para Push Notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log("[SW] Registrado com sucesso:", registration.scope);
      },
      (error) => {
        console.error("[SW] Falha ao registrar:", error);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
