import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Vo2MaxEntryButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      className="w-full border-primary/40 text-primary hover:bg-primary/10"
      onClick={() => navigate("/vo2max")}
    >
      <FlaskConical className="h-4 w-4 mr-2" />
      Realizar Teste de VO2 Máx
    </Button>
  );
}
