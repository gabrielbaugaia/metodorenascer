interface AnamneseProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function AnamneseProgress({ currentStep, totalSteps, stepLabels }: AnamneseProgressProps) {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 border-b border-border/50 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {stepLabels[currentStep - 1]}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {stepLabels.map((label, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
            title={label}
          />
        ))}
      </div>
    </div>
  );
}
