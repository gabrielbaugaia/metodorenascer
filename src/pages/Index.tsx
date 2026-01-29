import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MentorSection } from "@/components/landing/MentorSection";
import { WhatIsSection } from "@/components/landing/WhatIsSection";
import { MethodologySection } from "@/components/landing/MethodologySection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import TransformationsGallery from "@/components/landing/TransformationsGallery";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { EvolutionSection } from "@/components/landing/EvolutionSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Método Renascer | Sistema de Prescrição Física, Nutricional e Mental";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'O Método Renascer é um sistema de prescrição física, nutricional e mental criado para transformar corpo, energia e disciplina de forma personalizada e sustentável.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <MentorSection />
        <WhatIsSection />
        <MethodologySection />
        <HowItWorksSection />
        <TransformationsGallery />
        <TestimonialsSection />
        <EvolutionSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
