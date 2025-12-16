import { useEffect } from "react";
import { PreLaunchHeader } from "@/components/landing/PreLaunchHeader";
import { UrgencyBanner } from "@/components/landing/UrgencyBanner";
import { PreLaunchHeroSection } from "@/components/landing/PreLaunchHeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { MethodologySection } from "@/components/landing/MethodologySection";
import { MentorSection } from "@/components/landing/MentorSection";
import TransformationsGallery from "@/components/landing/TransformationsGallery";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

import { PreLaunchCTASection } from "@/components/landing/PreLaunchCTASection";
import { Footer } from "@/components/Footer";

const PreLaunchIndex = () => {
  useEffect(() => {
    document.title = "Método Renascer: Grupo VIP Pré-Lançamento";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Entre no grupo VIP exclusivo do Método Renascer. Condição especial de pré-lançamento com vagas limitadas. Transformação completa com treino personalizado e acompanhamento 24h.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <UrgencyBanner />
      <PreLaunchHeader />
      <main>
        <PreLaunchHeroSection />
        <ProblemSection />
        <MethodologySection />
        <MentorSection />
        <TransformationsGallery />
        <TestimonialsSection />
        
        <PreLaunchCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default PreLaunchIndex;
