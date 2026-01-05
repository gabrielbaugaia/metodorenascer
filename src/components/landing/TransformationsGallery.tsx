import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

import transform1 from "@/assets/transformations/transform-1.jpeg";
import transform2 from "@/assets/transformations/transform-2.jpeg";
import transform3 from "@/assets/transformations/transform-3.jpeg";
import transform4 from "@/assets/transformations/transform-4.jpeg";
import transform5 from "@/assets/transformations/transform-5.jpeg";
import transform6 from "@/assets/transformations/transform-6.jpeg";
import transform7 from "@/assets/transformations/transform-7.jpeg";
import transform8 from "@/assets/transformations/transform-8.jpeg";

// Paired transformations for before/after slider
const transformationPairs = [
  { before: transform1, after: transform2, id: "pair-1" },
  { before: transform3, after: transform4, id: "pair-2" },
  { before: transform5, after: transform6, id: "pair-3" },
  { before: transform7, after: transform8, id: "pair-4" },
];

const transformations = [
  { id: "cliente-01", image: transform1 },
  { id: "cliente-02", image: transform2 },
  { id: "cliente-03", image: transform3 },
  { id: "cliente-04", image: transform4 },
  { id: "cliente-05", image: transform5 },
  { id: "cliente-06", image: transform6 },
  { id: "cliente-07", image: transform7 },
  { id: "cliente-08", image: transform8 },
];

// Lazy Image component with Intersection Observer
const LazyImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative w-full aspect-square bg-card rounded-lg overflow-hidden">
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover object-top transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className || ""}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

const TransformationsGallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % transformations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  const nextPair = () => {
    setCurrentPairIndex((prev) => (prev + 1) % transformationPairs.length);
  };

  const prevPair = () => {
    setCurrentPairIndex((prev) => (prev - 1 + transformationPairs.length) % transformationPairs.length);
  };

  return (
    <section 
      ref={ref} 
      className={`py-20 md:py-28 section-dark transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 tracking-wide">
            Transformações <span className="text-primary">Reais</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Arraste para comparar os resultados
          </p>
        </div>

        {/* Interactive Before/After Slider - Desktop */}
        <div className="hidden md:block max-w-4xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {transformationPairs.slice(0, 2).map((pair) => (
              <BeforeAfterSlider
                key={pair.id}
                beforeImage={pair.before}
                afterImage={pair.after}
              />
            ))}
          </div>
        </div>

        {/* Interactive Before/After Slider - Mobile Carousel */}
        <div className="md:hidden relative mb-8">
          <BeforeAfterSlider
            beforeImage={transformationPairs[currentPairIndex].before}
            afterImage={transformationPairs[currentPairIndex].after}
          />
          
          {/* Navigation Buttons */}
          <button
            onClick={prevPair}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors shadow-lg z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextPair}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors shadow-lg z-10"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {transformationPairs.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPairIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPairIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Additional Gallery - Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {transformations.map((transformation) => (
            <div
              key={transformation.id}
              className="hover:scale-[1.02] transition-transform duration-300"
            >
              <LazyImage
                src={transformation.image}
                alt="Transformação real"
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm mb-4">Você pode ser o próximo</p>
          <Button variant="fire" size="lg" asChild>
            <a href="#preco">
              QUERO MINHA TRANSFORMAÇÃO
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TransformationsGallery;
