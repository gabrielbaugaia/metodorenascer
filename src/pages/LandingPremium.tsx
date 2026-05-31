import { useEffect, useRef } from "react";
import {
  LPHeader,
  LPHero,
  LPProblem,
  LPMentor,
  LPPillars,
  LPDashboard,
  LPTransformations,
  LPIdentity,
  LPPlans,
  LPDiagnostic,
  LPFaq,
  LPClosing,
  LPFooter,
  LPStickyMobileCTA,
} from "@/components/landing-premium/LPSections";

const LandingPremium = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Método Renascer | Sistema de transformação para adultos +30";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Você não precisa de mais motivação. Você precisa de um sistema. Método Renascer combina ciência, acompanhamento humano e inteligência de dados.",
      );
    }
  }, []);

  // Cursor glow — desktop only
  useEffect(() => {
    if (window.matchMedia("(max-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = glowRef.current;
    if (!el) return;
    el.style.display = "block";
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={rootRef}
      className="lp-root min-h-screen overflow-x-hidden"
      style={{ background: "#0B0B0B", color: "#F5F5F5" }}
    >
      <div
        ref={glowRef}
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none z-0 hidden"
        style={{
          background: "radial-gradient(circle, rgba(255,90,31,0.06) 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <LPHeader />
      <main>
        <LPHero />
        <LPProblem />
        <LPMentor />
        <LPPillars />
        <LPDashboard />
        <LPTransformations />
        <LPIdentity />
        <LPPlans />
        <LPDiagnostic />
        <LPFaq />
        <LPClosing />
      </main>
      <LPFooter />
      <LPStickyMobileCTA />
    </div>
  );
};

export default LandingPremium;
