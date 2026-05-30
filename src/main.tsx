import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import "./index.css";

// Render app first for faster initial paint
createRoot(document.getElementById("root")!).render(<App />);

// Configurações nativas
if (Capacitor.isNativePlatform()) {
  // Esconder a splash screen e configurar a status bar
  SplashScreen.hide();
  StatusBar.setStyle({ style: Style.Default });

  // Configurar listeners de Push Notifications
  PushNotifications.addListener('registration', async (token) => {
    console.log('[Push] Registro bem-sucedido, token:', token.value);
    
    // Salvar o token no Supabase para o usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: token.value,
          p256dh: 'native',
          auth: 'native',
        },
        { onConflict: "user_id,endpoint" }
      );
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] Erro no registro:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notificação recebida:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[Push] Ação realizada na notificação:', notification);
  });
}

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
