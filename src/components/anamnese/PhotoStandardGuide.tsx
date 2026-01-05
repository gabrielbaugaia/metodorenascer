import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ZoomIn } from "lucide-react";
import photoModelMale from "@/assets/photo-model-male.jpeg";
import photoModelFemale from "@/assets/photo-model-female.jpeg";

interface PhotoStandardGuideProps {
  compact?: boolean;
}

export function PhotoStandardGuide({ compact = false }: PhotoStandardGuideProps) {
  const [showFull, setShowFull] = useState(false);

  if (compact) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-3">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground mb-2">Modelo padrão para fotos:</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <img 
                      src={photoModelMale} 
                      alt="Modelo masculino" 
                      className="w-full h-auto rounded-md border border-border/50 group-hover:border-primary/50 transition-colors"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-md">
                      <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 px-1 rounded">Masculino</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Modelo Padrão - Masculino</DialogTitle>
                  </DialogHeader>
                  <img src={photoModelMale} alt="Modelo masculino" className="w-full h-auto rounded-lg" />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <img 
                      src={photoModelFemale} 
                      alt="Modelo feminino" 
                      className="w-full h-auto rounded-md border border-border/50 group-hover:border-primary/50 transition-colors"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-md">
                      <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-background/80 px-1 rounded">Feminino</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Modelo Padrão - Feminino</DialogTitle>
                  </DialogHeader>
                  <img src={photoModelFemale} alt="Modelo feminino" className="w-full h-auto rounded-lg" />
                </DialogContent>
              </Dialog>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Sem camiseta (homens) ou top esportivo (mulheres)</li>
              <li>• Sem acessórios (bonés, óculos, relógios)</li>
              <li>• Corpo inteiro visível</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-2">
            📸 Modelo Padrão para Fotos (Obrigatório)
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Siga exatamente o padrão abaixo. Fotos fora do padrão serão recusadas automaticamente.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  <img 
                    src={photoModelMale} 
                    alt="Modelo masculino" 
                    className="w-full h-auto rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-background/90 rounded px-2 py-1 text-center">
                    <span className="text-xs font-medium">Masculino</span>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Modelo Padrão - Masculino</DialogTitle>
                </DialogHeader>
                <img src={photoModelMale} alt="Modelo masculino" className="w-full h-auto rounded-lg" />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  <img 
                    src={photoModelFemale} 
                    alt="Modelo feminino" 
                    className="w-full h-auto rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-background/90 rounded px-2 py-1 text-center">
                    <span className="text-xs font-medium">Feminino</span>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Modelo Padrão - Feminino</DialogTitle>
                </DialogHeader>
                <img src={photoModelFemale} alt="Modelo feminino" className="w-full h-auto rounded-lg" />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
            <p className="text-sm font-medium text-destructive mb-1">⚠️ Fotos NÃO serão aceitas se:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>❌ Estiver usando camiseta, blusa ou casaco</li>
              <li>❌ Estiver usando boné, óculos ou acessórios</li>
              <li>❌ O corpo não estiver visível para avaliação</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
