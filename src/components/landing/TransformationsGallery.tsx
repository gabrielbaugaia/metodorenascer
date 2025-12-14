import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import transform1 from "@/assets/transformations/transform-1.jpeg";
import transform2 from "@/assets/transformations/transform-2.jpeg";
import transform3 from "@/assets/transformations/transform-3.jpeg";
import transform4 from "@/assets/transformations/transform-4.jpeg";
import transform5 from "@/assets/transformations/transform-5.jpeg";
import transform6 from "@/assets/transformations/transform-6.jpeg";
import transform7 from "@/assets/transformations/transform-7.jpeg";
import transform8 from "@/assets/transformations/transform-8.jpeg";

const transformations = [
  {
    id: "cliente-01",
    image: transform1,
    weightLost: "18kg",
    duration: "4 meses",
    testimonial: "Recuperei minha autoestima e energia para viver!",
  },
  {
    id: "cliente-02",
    image: transform2,
    weightLost: "22kg",
    duration: "5 meses",
    testimonial: "Força voltou e mente mais forte que nunca.",
  },
  {
    id: "cliente-03",
    image: transform3,
    weightLost: "15kg",
    duration: "3 meses",
    testimonial: "Transformação completa em corpo e mente.",
  },
  {
    id: "cliente-04",
    image: transform4,
    weightLost: "12kg",
    duration: "3 meses",
    testimonial: "Definição muscular que sempre sonhei.",
  },
  {
    id: "cliente-05",
    image: transform5,
    weightLost: "8kg",
    duration: "4 meses",
    testimonial: "Ganho de massa e definição impressionante.",
  },
  {
    id: "cliente-06",
    image: transform6,
    weightLost: "15kg",
    duration: "5 meses",
    testimonial: "Corpo totalmente transformado.",
  },
  {
    id: "cliente-07",
    image: transform7,
    weightLost: "20kg",
    duration: "6 meses",
    testimonial: "Nunca imaginei que seria possível. Agora vivo!",
  },
  {
    id: "cliente-08",
    image: transform8,
    weightLost: "25kg",
    duration: "5 meses",
    testimonial: "Minha vida mudou completamente.",
  },
];

const TransformationsGallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % transformations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + transformations.length) % transformations.length);
  };

  return (
    <section className="py-20 md:py-32 bg-black">
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
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {transformations.map((transformation) => (
            <div
              key={transformation.id}
              className="group relative bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#FF6200]/50 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Real Transformation Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={transformation.image}
                  alt={`Transformação ${transformation.id}`}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                
                {/* Weight Lost Badge */}
                <div className="absolute top-3 right-3 bg-[#FF6200] text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                  -{transformation.weightLost}
                </div>

                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#FF6200] text-sm font-semibold">
                    {transformation.duration}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 text-sm">
                    -{transformation.weightLost}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm italic line-clamp-2">
                  "{transformation.testimonial}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {transformations.map((transformation) => (
                <div key={transformation.id} className="w-full flex-shrink-0 px-1">
                  <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Real Transformation Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={transformation.image}
                        alt={`Transformação ${transformation.id}`}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                      
                      <div className="absolute top-3 right-3 bg-[#FF6200] text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                        -{transformation.weightLost}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#FF6200] text-sm font-semibold">
                          {transformation.duration}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400 text-sm">
                          -{transformation.weightLost}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm italic">
                        "{transformation.testimonial}"
                      </p>
                    </div>
                  </div>
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
