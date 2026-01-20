import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, X, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuscleGroupMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  muscleGroups: string[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

// Leg sub-groups that auto-include "Perna"
const LEG_SUBGROUPS = ["Quadríceps", "Posterior de Coxa", "Glúteos", "Panturrilha", "Adutores"];

// Quick presets for common combinations
const PRESETS = [
  { label: "Perna + Quadríceps", groups: ["Perna", "Quadríceps"] },
  { label: "Perna + Posterior", groups: ["Perna", "Posterior de Coxa"] },
  { label: "Perna + Glúteos", groups: ["Perna", "Glúteos"] },
  { label: "Perna + Panturrilha", groups: ["Perna", "Panturrilha"] },
  { label: "Perna + Adutores", groups: ["Perna", "Adutores"] },
];

export function MuscleGroupMultiSelect({
  value,
  onChange,
  muscleGroups,
  disabled = false,
  placeholder = "Selecionar grupos...",
  className,
  compact = false,
}: MuscleGroupMultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Auto-add "Perna" when selecting a leg sub-group
  const handleToggle = (group: string) => {
    let newValue: string[];
    
    if (value.includes(group)) {
      // Removing
      newValue = value.filter(v => v !== group);
      // If removing "Perna", also remove all leg sub-groups
      if (group === "Perna") {
        newValue = newValue.filter(v => !LEG_SUBGROUPS.includes(v));
      }
    } else {
      // Adding
      newValue = [...value, group];
      // If adding a leg sub-group, auto-add "Perna"
      if (LEG_SUBGROUPS.includes(group) && !newValue.includes("Perna")) {
        newValue = ["Perna", ...newValue];
      }
    }
    
    onChange(newValue);
  };

  const handlePreset = (groups: string[]) => {
    onChange(groups);
    setOpen(false);
  };

  const handleClear = () => {
    onChange([]);
  };

  const displayValue = useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return value[0];
    // Show first group + count
    return `${value[0]} +${value.length - 1}`;
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between font-normal",
            value.length === 0 && "text-muted-foreground",
            value.length > 0 && "border-primary/50",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Dumbbell className="h-4 w-4 flex-shrink-0" />
            {compact ? (
              value.length > 0 ? `${value.length} grupo${value.length > 1 ? 's' : ''}` : placeholder
            ) : (
              displayValue
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Selected badges */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1 p-3 border-b">
            {value.map(group => (
              <Badge
                key={group}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => handleToggle(group)}
              >
                {group}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              Limpar
            </Button>
          </div>
        )}

        {/* Quick presets */}
        <div className="p-3 border-b bg-muted/50">
          <p className="text-xs text-muted-foreground mb-2">Atalhos rápidos:</p>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handlePreset(preset.groups)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* All groups */}
        <ScrollArea className="h-60">
          <div className="p-3 space-y-2">
            {muscleGroups.map(group => {
              const isSelected = value.includes(group);
              const isLegSubgroup = LEG_SUBGROUPS.includes(group);
              
              return (
                <div
                  key={group}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted",
                    isSelected && "bg-primary/10",
                    isLegSubgroup && "ml-4 border-l-2 border-primary/30"
                  )}
                  onClick={() => handleToggle(group)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(group)}
                    className="pointer-events-none"
                  />
                  <span className={cn(
                    "text-sm",
                    isSelected && "font-medium",
                    group === "Perna" && "font-semibold text-primary"
                  )}>
                    {group}
                  </span>
                  {isLegSubgroup && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      + Perna
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
