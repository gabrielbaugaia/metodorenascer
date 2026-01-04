import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NotificationPreferences {
  push_enabled: boolean;
  workout_reminder_enabled: boolean;
  workout_reminder_time: string;
  checkin_reminder_enabled: boolean;
  inactivity_reminder_enabled: boolean;
  workout_completed_enabled: boolean;
}

const VAPID_PUBLIC_KEY = "BNZ08K43QnOQZK8jPPUczn45yepS8kQ_4p4-Iv7-0qNyLfGlyPpvNughcc_MI6RFqPZIDvXPdG4Ha_HFoYRsIBE";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    
    if (supported && user) {
      checkSubscription();
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Erro ao verificar subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setPreferences({
          push_enabled: data.push_enabled,
          workout_reminder_enabled: data.workout_reminder_enabled,
          workout_reminder_time: data.workout_reminder_time,
          checkin_reminder_enabled: data.checkin_reminder_enabled,
          inactivity_reminder_enabled: data.inactivity_reminder_enabled,
          workout_completed_enabled: data.workout_completed_enabled,
        });
      } else {
        // Criar preferências padrão
        const defaultPrefs: NotificationPreferences = {
          push_enabled: true,
          workout_reminder_enabled: true,
          workout_reminder_time: "08:00:00",
          checkin_reminder_enabled: true,
          inactivity_reminder_enabled: true,
          workout_completed_enabled: true,
        };
        
        await supabase.from("notification_preferences").insert({
          user_id: user.id,
          ...defaultPrefs,
        });
        
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error("Erro ao buscar preferências:", error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão para notificações negada");
        return false;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Verificar se já existe subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        if (!VAPID_PUBLIC_KEY) {
          console.error("VAPID_PUBLIC_KEY não configurada");
          toast.error("Configuração de notificações incompleta");
          return false;
        }
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer,
        });
      }

      const subscriptionJson = subscription.toJSON();
      
      // Salvar no banco
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || "",
          auth: subscriptionJson.keys?.auth || "",
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notificações ativadas!");
      return true;
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      toast.error("Erro ao ativar notificações");
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remover do banco
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success("Notificações desativadas");
      return true;
    } catch (error) {
      console.error("Erro ao desativar notificações:", error);
      toast.error("Erro ao desativar notificações");
      return false;
    }
  }, [user]);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("notification_preferences")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;

        setPreferences((prev) => (prev ? { ...prev, ...updates } : null));
        toast.success("Preferências atualizadas");
        return true;
      } catch (error) {
        console.error("Erro ao atualizar preferências:", error);
        toast.error("Erro ao atualizar preferências");
        return false;
      }
    },
    [user]
  );

  const getPermissionStatus = useCallback(() => {
    if (!isSupported) return "unsupported";
    return Notification.permission;
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    loading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    getPermissionStatus,
    refetchPreferences: fetchPreferences,
  };
}
