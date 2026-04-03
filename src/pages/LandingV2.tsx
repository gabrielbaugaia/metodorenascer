import { useEffect, useRef } from "react";
import { V2Header } from "@/components/landing-v2/V2Header";
import { V2HeroSection } from "@/components/landing-v2/V2HeroSection";
import { V2FlowSection } from "@/components/landing-v2/V2FlowSection";
import { V2SisScoreSection } from "@/components/landing-v2/V2SisScoreSection";
import { V2FeaturesGridSection } from "@/components/landing-v2/V2FeaturesGridSection";
import { V2DetectionSection } from "@/components/landing-v2/V2DetectionSection";
import { V2PricingSection } from "@/components/landing-v2/V2PricingSection";
import { V2GuaranteeStrip } from "@/components/landing-v2/V2GuaranteeStrip";
import { V2TestimonialsSection } from "@/components/landing-v2/V2TestimonialsSection";
import { V2FAQSection } from "@/components/landing-v2/V2FAQSection";
import { V2CTASection } from "@/components/landing-v2/V2CTASection";
import { V2Footer } from "@/components/landing-v2/V2Footer";

const LandingV2 = () => {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Método Renascer | Sistema de Inteligência em Performance";
  }, []);

  // Cursor glow — desktop only
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobile) return;
    const el = glowRef.current;
    if (!el) return;
    el.style.display = "block";
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="min-h-screen bg-background font-body-v2 overflow-x-hidden">
      {/* Cursor glow */}
      <div
        ref={glowRef}
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none z-0 hidden"
        style={{
          background: "radial-gradient(circle, rgba(255,101,0,.06) 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      <V2Header />
      <main>
        <V2HeroSection />
        <div className="h-[1px] mx-7 md:mx-[60px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />
        <V2FlowSection />
        <div className="h-[1px] mx-7 md:mx-[60px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />
        <V2SisScoreSection />
        <V2FeaturesGridSection />
        <div className="h-[1px] mx-7 md:mx-[60px]" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--border)), transparent)" }} />
        <V2DetectionSection />
        <V2PricingSection />
        <V2GuaranteeStrip />
        <V2TestimonialsSection />
        <V2FAQSection />
        <V2CTASection />
      </main>
      <V2Footer />
    </div>
  );
};

export default LandingV2;
