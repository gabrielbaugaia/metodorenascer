import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";
import { 
  Save, 
  X, 
  Upload, 
  CheckCircle, 
  Trash2, 
  Image,
  AlertTriangle,
  Wand2,
  Expand,
  Globe
} from "lucide-react";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string[];
  status: "active" | "pending" | "missing";
  api_source: string | null;
  last_checked_at: string | null;
  created_at: string;
}

interface ExerciseGifCardProps {
  gif: ExerciseGif;
  muscleGroups: string[];
  editingFields: Record<string, { field: string; value: string | string[] }>;
  savingInline: string | null;
  uploadingGif: boolean;
  suggestingName: string | null;
  searchingOnline: string | null;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onInlineUpdate: (id: string, field: string, value: string | string[]) => void;
  onSaveChanges: (id: string) => void;
  onCancelChanges: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, id?: string) => void;
  onActivate: (gif: ExerciseGif) => void;
  onDelete: (id: string) => void;
  onPreview: (gif: ExerciseGif) => void;
  onSuggestName: (gifId: string, gifUrl: string) => void;
  onSearchOnline: (gif: ExerciseGif) => void;
  hasPendingChanges: (id: string) => boolean;
  isExternalBrokenUrl: (url: string | null) => boolean;
  isGifReadyToActivate: (gif: ExerciseGif) => boolean;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function ExerciseGifCard({
  gif,
  muscleGroups,
  editingFields,
  savingInline,
  uploadingGif,
  suggestingName,
  searchingOnline,
  selected,
  onToggleSelect,
  onInlineUpdate,
  onSaveChanges,
  onCancelChanges,
  onUpload,
  onActivate,
  onDelete,
  onPreview,
  onSuggestName,
  onSearchOnline,
  hasPendingChanges,
  isExternalBrokenUrl,
  isGifReadyToActivate,
  getStatusBadge,
}: ExerciseGifCardProps) {
  const hasBrokenUrl = isExternalBrokenUrl(gif.gif_url);
  const isReady = isGifReadyToActivate(gif);
  const hasChanges = hasPendingChanges(gif.id);

  // Get current muscle groups (from editing or from gif)
  const currentGroups = (editingFields[`${gif.id}-muscle_group`]?.value as string[] | undefined) ?? gif.muscle_group ?? [];

  return (
    <Card 
      className={`p-4 ${hasBrokenUrl ? 'border-destructive/50 bg-destructive/5' : ''} ${isReady ? 'border-primary/30 bg-primary/5' : ''} ${selected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex gap-4">
        {/* Batch Select Checkbox + GIF Preview */}
        <div className="flex flex-col items-center gap-2">
          {onToggleSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(gif.id)}
              className="mt-1"
              aria-label="Selecionar para edição em lote"
            />
          )}
          <div 
            className="relative flex-shrink-0 cursor-pointer"
            onClick={() => gif.gif_url && onPreview(gif)}
          >
            {gif.gif_url ? (
              <>
                <img 
                  src={gif.gif_url} 
                  alt={gif.exercise_name_pt}
                  className={`w-20 h-20 object-cover rounded-lg ${hasBrokenUrl ? 'border-2 border-destructive' : 'border border-border'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {hasBrokenUrl && (
                  <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-background/80 rounded p-0.5">
                  <Expand className="h-3 w-3 text-muted-foreground" />
                </div>
              </>
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/30">
                <Image className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Name Input + AI Suggest Button */}
          <div className="flex gap-2">
            <Input
              value={(editingFields[`${gif.id}-exercise_name_pt`]?.value as string) ?? gif.exercise_name_pt}
              onChange={(e) => onInlineUpdate(gif.id, 'exercise_name_pt', e.target.value)}
              className={`h-9 text-sm flex-1 ${
                editingFields[`${gif.id}-exercise_name_pt`] 
                  ? 'border-primary' 
                  : ''
              }`}
              placeholder="Nome do exercício"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => gif.gif_url && onSuggestName(gif.id, gif.gif_url)}
              disabled={suggestingName === gif.id || !gif.gif_url}
              title="Sugerir nome com IA"
            >
              {suggestingName === gif.id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Wand2 className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>

          {/* Muscle Group Multi-Select */}
          <MuscleGroupMultiSelect
            value={currentGroups}
            onChange={(groups) => onInlineUpdate(gif.id, 'muscle_group', groups)}
            muscleGroups={muscleGroups}
            className={`h-9 text-sm w-full ${
              editingFields[`${gif.id}-muscle_group`] 
                ? 'border-primary' 
                : currentGroups.length === 0 || currentGroups.includes("Pendente")
                  ? 'border-destructive/50' 
                  : ''
            }`}
            compact
          />

          {/* Status + Actions Row */}
          <div className="flex items-center justify-between gap-2">
            <div>{getStatusBadge(gif.status)}</div>
            
            <div className="flex items-center gap-1">
              {/* Save/Cancel buttons when there are pending changes */}
              {hasChanges && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    onClick={() => onSaveChanges(gif.id)}
                    disabled={savingInline === gif.id}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onCancelChanges(gif.id)}
                    disabled={savingInline === gif.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Upload button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/gif,image/*"
                  className="hidden"
                  onChange={(e) => onUpload(e, gif.id)}
                  disabled={uploadingGif}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8 text-primary"
                >
                  <span>
                    <Upload className="h-4 w-4" />
                  </span>
                </Button>
              </label>

              {/* Search Online button - only show if no GIF */}
              {!gif.gif_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => onSearchOnline(gif)}
                  disabled={searchingOnline === gif.id}
                  title="Buscar GIF na internet"
                >
                  {searchingOnline === gif.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Activate button */}
              {gif.status !== "active" && gif.gif_url && !hasBrokenUrl && !hasChanges && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => onActivate(gif)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(gif.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
