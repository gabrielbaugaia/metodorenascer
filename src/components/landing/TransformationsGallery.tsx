import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

import transform1 from "@/assets/transformations/transform-1.jpeg";
import transform2 from "@/assets/transformations/transform-2.jpeg";
import transform3 from "@/assets/transformations/transform-3.jpeg";
import transform4 from "@/assets/transformations/transform-4.jpeg";
import transform5 from "@/assets/transformations/transform-5.jpeg";
import transform6 from "@/assets/transformations/transform-6.jpeg";
import transform7 from "@/assets/transformations/transform-7.jpeg";
import transform8 from "@/assets/transformations/transform-8.jpeg";

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

const TransformationsGallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % transformations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  return (
    <section ref={ref} className={`py-20 md:py-32 bg-black transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            TRANSFORMAÇÕES <span className="text-[#FF6200]">REAIS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Resultados comprovados de quem já passou pelo Método Renascer
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {transformations.map((transformation) => (
            <div
              key={transformation.id}
              className="group relative rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300"
            >
              <img
                src={transformation.image}
                alt="Transformação real"
                className="w-full aspect-square object-cover object-top"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {transformations.map((transformation) => (
                <div key={transformation.id} className="w-full flex-shrink-0 px-1">
                  <img
                    src={transformation.image}
                    alt="Transformação real"
                    className="w-full aspect-square object-cover object-top rounded-xl"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#FF6200] rounded-full flex items-center justify-center text-black hover:bg-[#FF8533] transition-colors shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#FF6200] rounded-full flex items-center justify-center text-black hover:bg-[#FF8533] transition-colors shadow-lg"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {transformations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-[#FF6200] w-6" : "bg-zinc-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-zinc-400 mb-4">Você pode ser o próximo</p>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FF6200] hover:bg-[#FF8533] text-black font-bold py-4 px-8 rounded-full text-lg transition-all hover:scale-105"
          >
            Quero Minha Transformação
          </a>
        </div>
      </div>
    </section>
  );
};

export default TransformationsGallery;
