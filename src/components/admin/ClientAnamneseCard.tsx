import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Scale, 
  Ruler, 
  Target, 
  AlertCircle, 
  Clock, 
  Calendar,
  Heart
} from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  sexo?: string;
  goals?: string;
  injuries?: string;
  availability?: string;
  nivel_experiencia?: string;
  restricoes_medicas?: string;
  objetivos_detalhados?: any;
  medidas?: any;
  data_nascimento?: string;
  telefone?: string;
}

interface ClientAnamneseCardProps {
  profile: Profile;
}

export function ClientAnamneseCard({ profile }: ClientAnamneseCardProps) {
  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Anamnese do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="font-medium">{profile.weight ? `${profile.weight} kg` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Altura</p>
              <p className="font-medium">{profile.height ? `${profile.height} cm` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Idade</p>
              <p className="font-medium">{profile.age ? `${profile.age} anos` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sexo</p>
              <p className="font-medium">{profile.sexo || "—"}</p>
            </div>
          </div>
        </div>

        {/* Experience Level */}
        {profile.nivel_experiencia && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nível de Experiência</p>
            <Badge variant="secondary">{profile.nivel_experiencia}</Badge>
          </div>
        )}

        {/* Goals */}
        {profile.goals && (
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Objetivos</p>
              <p className="text-sm">{profile.goals}</p>
            </div>
          </div>
        )}

        {/* Detailed Goals */}
        {profile.objetivos_detalhados && (
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Objetivos Detalhados</p>
              <p className="text-sm">
                {typeof profile.objetivos_detalhados === 'string' 
                  ? profile.objetivos_detalhados 
                  : JSON.stringify(profile.objetivos_detalhados, null, 2)}
              </p>
            </div>
          </div>
        )}

        {/* Availability */}
        {profile.availability && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Disponibilidade</p>
              <p className="text-sm">{profile.availability}</p>
            </div>
          </div>
        )}

        {/* Injuries */}
        {profile.injuries && (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Lesões/Limitações</p>
              <p className="text-sm text-orange-500">{profile.injuries}</p>
            </div>
          </div>
        )}

        {/* Medical Restrictions */}
        {profile.restricoes_medicas && (
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Restrições Médicas</p>
              <p className="text-sm text-red-500">{profile.restricoes_medicas}</p>
            </div>
          </div>
        )}

        {/* Measurements */}
        {profile.medidas && Object.keys(profile.medidas).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Medidas Corporais</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(profile.medidas).map(([key, value]) => (
                <div key={key} className="bg-background rounded p-2 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  <p className="font-medium text-sm">{String(value)} cm</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
