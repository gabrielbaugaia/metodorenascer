import { useState, useEffect } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Globe, Bell, Palette, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

const languages = [
  { value: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

export default function Configuracoes() {
  const [language, setLanguage] = useState("pt-BR");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved language preference
    const savedLang = localStorage.getItem("app-language");
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    localStorage.setItem("app-language", value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Configurações
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Personalize suas preferências do aplicativo
          </p>
        </div>

        {/* Notificações */}
        <NotificationSettings />

        {/* Aparência */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Escolha o tema visual do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="theme-light"
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Claro</span>
              </Label>

              <Label
                htmlFor="theme-dark"
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Escuro</span>
              </Label>

              <Label
                htmlFor="theme-system"
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <Monitor className="h-6 w-6" />
                <span className="text-sm font-medium">Sistema</span>
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Idioma */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Idioma
            </CardTitle>
            <CardDescription>
              Selecione o idioma preferido da interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={language}
              onValueChange={handleLanguageChange}
              className="space-y-2"
            >
              {languages.map((lang) => (
                <Label
                  key={lang.value}
                  htmlFor={`lang-${lang.value}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    language === lang.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={lang.value} id={`lang-${lang.value}`} />
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                  {lang.value !== "pt-BR" && (
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Em breve
                    </span>
                  )}
                </Label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-3">
              Atualmente apenas Português (Brasil) está disponível. Novos idiomas serão adicionados em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
