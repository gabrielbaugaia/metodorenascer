import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Vo2MaxEntryButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      className="w-full border-foreground/40 text-foreground hover:bg-foreground/10"
      onClick={() => navigate("/vo2max")}
    >
      <FlaskConical className="h-4 w-4 mr-2" />
      Realizar Teste de VO2 Máx
    </Button>
  );
}
