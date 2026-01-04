import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Clock, Dumbbell, Camera, AlertCircle, Trophy, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    loading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    getPermissionStatus,
  } = usePushNotifications();
  
  const [subscribing, setSubscribing] = useState(false);
  const [savingTime, setSavingTime] = useState(false);
  const [localTime, setLocalTime] = useState(
    preferences?.workout_reminder_time?.slice(0, 5) || "08:00"
  );

  const permissionStatus = getPermissionStatus();

  const handleToggleSubscription = async () => {
    setSubscribing(true);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
    setSubscribing(false);
  };

  const handleTimeChange = async () => {
    setSavingTime(true);
    await updatePreferences({ workout_reminder_time: localTime + ":00" });
    setSavingTime(false);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta notificações push. Tente usar um navegador mais recente como Chrome, Firefox ou Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativar/Desativar Push */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isSubscribed ? "Notificações ativadas" : "Notificações desativadas"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? "Você receberá lembretes e avisos"
                  : "Ative para receber lembretes"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleToggleSubscription}
            disabled={subscribing}
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
          >
            {subscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              "Desativar"
            ) : (
              "Ativar"
            )}
          </Button>
        </div>

        {permissionStatus === "denied" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você bloqueou as notificações. Para ativá-las, acesse as configurações do navegador e permita notificações para este site.
            </AlertDescription>
          </Alert>
        )}

        {isSubscribed && preferences && (
          <>
            {/* Horário do lembrete */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Horário do lembrete diário</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={localTime}
                  onChange={(e) => setLocalTime(e.target.value)}
                  className="w-32"
                />
                <Button
                  onClick={handleTimeChange}
                  disabled={savingTime || localTime + ":00" === preferences.workout_reminder_time}
                  size="sm"
                  variant="outline"
                >
                  {savingTime ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Você receberá um lembrete neste horário para treinar
              </p>
            </div>

            {/* Tipos de notificação */}
            <div className="space-y-4">
              <p className="text-sm font-medium">Tipos de notificação</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="workout-reminder">Lembrete de treino</Label>
                    <p className="text-xs text-muted-foreground">
                      Lembrete diário no horário configurado
                    </p>
                  </div>
                </div>
                <Switch
                  id="workout-reminder"
                  checked={preferences.workout_reminder_enabled}
                  onCheckedChange={(checked) =>
                    updatePreferences({ workout_reminder_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="checkin-reminder">Lembrete de check-in</Label>
                    <p className="text-xs text-muted-foreground">
                      Aviso quando completar 30 dias
                    </p>
                  </div>
                </div>
                <Switch
                  id="checkin-reminder"
                  checked={preferences.checkin_reminder_enabled}
                  onCheckedChange={(checked) =>
                    updatePreferences({ checkin_reminder_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="inactivity-reminder">Lembrete de inatividade</Label>
                    <p className="text-xs text-muted-foreground">
                      Aviso após 3+ dias sem acessar
                    </p>
                  </div>
                </div>
                <Switch
                  id="inactivity-reminder"
                  checked={preferences.inactivity_reminder_enabled}
                  onCheckedChange={(checked) =>
                    updatePreferences({ inactivity_reminder_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="workout-completed">Parabéns por treino</Label>
                    <p className="text-xs text-muted-foreground">
                      Celebração quando concluir treino
                    </p>
                  </div>
                </div>
                <Switch
                  id="workout-completed"
                  checked={preferences.workout_completed_enabled}
                  onCheckedChange={(checked) =>
                    updatePreferences({ workout_completed_enabled: checked })
                  }
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
