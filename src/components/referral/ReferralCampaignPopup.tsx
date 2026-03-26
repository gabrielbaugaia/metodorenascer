import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share2, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  cashback_rules: any[];
}

export function ReferralCampaignPopup() {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const sessionKey = "referral_campaign_seen";
    if (sessionStorage.getItem(sessionKey)) return;

    const fetchCampaign = async () => {
      const now = new Date().toISOString();

      const { data: campaignData } = await supabase
        .from("referral_campaigns")
        .select("id, title, description, banner_image_url, cashback_rules")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .limit(1)
        .maybeSingle();

      if (!campaignData) return;

      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (codeData) {
        setReferralCode(codeData.code);
      }

      setCampaign(campaignData as Campaign);
      setOpen(true);
      sessionStorage.setItem(sessionKey, "true");
    };

    fetchCampaign();
  }, [user]);

  const referralLink = referralCode
    ? `${window.location.origin}/convite?ref=${referralCode}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `${campaign?.title || "Indique e Ganhe"} - Junte-se a mim no Método Renascer! ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 opacity-80 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Banner */}
        {campaign.banner_image_url && (
          <img
            src={campaign.banner_image_url}
            alt={campaign.title}
            className="w-full object-cover max-h-64"
          />
        )}

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">{campaign.title}</h3>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
            )}
          </div>

          {/* Cashback rules */}
          {campaign.cashback_rules && campaign.cashback_rules.length > 0 && (
            <div className="space-y-1.5">
              {campaign.cashback_rules.map((rule: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{rule.plan_type}</span>
                  <span className="font-semibold text-primary">{rule.cashback_amount}x cashback</span>
                </div>
              ))}
            </div>
          )}

          {/* Referral code */}
          {referralCode && (
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Seu código</p>
              <p className="font-mono text-lg font-bold text-primary">{referralCode}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={copyLink} variant="outline" className="flex-1" size="sm">
              {copied ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
              {copied ? "Copiado" : "Copiar Link"}
            </Button>
            <Button onClick={shareWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
              <Share2 className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
