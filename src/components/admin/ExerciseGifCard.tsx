import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
import { toast } from "sonner";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string;
  status: "active" | "pending" | "missing";
  api_source: string | null;
  last_checked_at: string | null;
  created_at: string;
}

interface ExerciseGifCardProps {
  gif: ExerciseGif;
  muscleGroups: string[];
  editingFields: Record<string, { field: string; value: string }>;
  savingInline: string | null;
  uploadingGif: boolean;
  suggestingName: string | null;
  searchingOnline: string | null;
  onInlineUpdate: (id: string, field: string, value: string) => void;
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

  return (
    <Card 
      className={`p-4 ${hasBrokenUrl ? 'border-destructive/50 bg-destructive/5' : ''} ${isReady ? 'border-green-500/50 bg-green-500/5' : ''}`}
    >
      <div className="flex gap-4">
        {/* GIF Preview - Large and Tappable */}
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

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Name Input + AI Suggest Button */}
          <div className="flex gap-2">
            <Input
              value={editingFields[`${gif.id}-exercise_name_pt`]?.value ?? gif.exercise_name_pt}
              onChange={(e) => onInlineUpdate(gif.id, 'exercise_name_pt', e.target.value)}
              className={`h-9 text-sm flex-1 ${
                editingFields[`${gif.id}-exercise_name_pt`] 
                  ? 'border-yellow-400' 
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

          {/* Muscle Group Select */}
          <Select
            value={editingFields[`${gif.id}-muscle_group`]?.value ?? gif.muscle_group}
            onValueChange={(value) => onInlineUpdate(gif.id, 'muscle_group', value)}
          >
            <SelectTrigger className={`h-9 text-sm ${
              editingFields[`${gif.id}-muscle_group`] 
                ? 'border-yellow-400' 
                : (editingFields[`${gif.id}-muscle_group`]?.value ?? gif.muscle_group) === 'Pendente' 
                  ? 'border-yellow-500' 
                  : ''
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                    className="h-8 w-8 text-green-600"
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
                  className="h-8 w-8 text-emerald-600"
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
                  className="h-8 w-8 text-green-600"
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
