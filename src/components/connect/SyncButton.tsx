import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  onSync: () => void;
  loading: boolean;
}

const SyncButton = ({ onSync, loading }: SyncButtonProps) => {
  return (
    <Button
      onClick={onSync}
      disabled={loading}
      className="w-full h-14 text-lg font-semibold gap-3"
      size="lg"
    >
      <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Sincronizando..." : "Sincronizar agora"}
    </Button>
  );
};

export default SyncButton;
