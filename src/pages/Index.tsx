import { useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { MethodologySection } from "@/components/landing/MethodologySection";
import { MentorSection } from "@/components/landing/MentorSection";
import TransformationsGallery from "@/components/landing/TransformationsGallery";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/Footer";
const Index = () => {
  useEffect(() => {
    document.title = "Método Renascer: Emagreça 15kg IA + Coach 24h";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transformação completa com treino personalizado por IA, receitas inteligentes e coach 24h via WhatsApp. Perca 15kg em 90 dias com garantia total.');
    }
  }, []);
  return <div className="min-h-screen bg-primary-foreground">
      <Header />
      <main className="bg-white">
        <HeroSection />
        <ProblemSection />
        <MethodologySection />
        <MentorSection />
        <TransformationsGallery />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>;
};
export default Index;