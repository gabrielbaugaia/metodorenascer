import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const transformations = [
  {
    name: "Ana Silva",
    location: "São Paulo, SP",
    weightLost: "18kg",
    duration: "4 meses",
    testimonial: "Recuperei minha autoestima e energia para viver!",
  },
  {
    name: "João Santos",
    location: "Rio de Janeiro, RJ",
    weightLost: "22kg",
    duration: "5 meses",
    testimonial: "Força voltou e mente mais forte que nunca.",
  },
  {
    name: "Maria Oliveira",
    location: "Belo Horizonte, MG",
    weightLost: "15kg",
    duration: "3 meses",
    testimonial: "Transformação completa em corpo e mente.",
  },
  {
    name: "Carlos Lima",
    location: "Curitiba, PR",
    weightLost: "25kg",
    duration: "6 meses",
    testimonial: "Nunca imaginei que seria possível. Agora vivo!",
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
          {transformations.map((transformation, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#FF6200]/50 transition-all duration-300"
            >
              {/* Before/After Placeholder */}
              <div className="relative aspect-[3/4] bg-zinc-900">
                <div className="absolute inset-0 flex">
                  {/* Before Side */}
                  <div className="w-1/2 bg-zinc-800 flex items-center justify-center border-r border-zinc-700">
                    <div className="text-center">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Antes</span>
                      <div className="w-16 h-16 mt-2 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-2xl text-zinc-500">?</span>
                      </div>
                    </div>
                  </div>
                  {/* After Side */}
                  <div className="w-1/2 bg-gradient-to-br from-[#FF6200]/20 to-zinc-900 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xs text-[#FF6200] uppercase tracking-wider">Depois</span>
                      <div className="w-16 h-16 mt-2 rounded-full bg-[#FF6200]/30 flex items-center justify-center border-2 border-[#FF6200]">
                        <span className="text-2xl text-[#FF6200]">★</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Weight Lost Badge */}
                <div className="absolute top-3 right-3 bg-[#FF6200] text-black font-bold px-3 py-1 rounded-full text-sm">
                  -{transformation.weightLost}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-white font-bold text-lg">{transformation.name}</h3>
                <p className="text-zinc-500 text-sm mb-3">{transformation.location}</p>
                <div className="flex items-center gap-2 mb-3">
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
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {transformations.map((transformation, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2">
                  <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Before/After Placeholder */}
                    <div className="relative aspect-[4/3] bg-zinc-900">
                      <div className="absolute inset-0 flex">
                        <div className="w-1/2 bg-zinc-800 flex items-center justify-center border-r border-zinc-700">
                          <div className="text-center">
                            <span className="text-xs text-zinc-500 uppercase tracking-wider">Antes</span>
                            <div className="w-12 h-12 mt-2 rounded-full bg-zinc-700 flex items-center justify-center">
                              <span className="text-xl text-zinc-500">?</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-1/2 bg-gradient-to-br from-[#FF6200]/20 to-zinc-900 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-xs text-[#FF6200] uppercase tracking-wider">Depois</span>
                            <div className="w-12 h-12 mt-2 rounded-full bg-[#FF6200]/30 flex items-center justify-center border-2 border-[#FF6200]">
                              <span className="text-xl text-[#FF6200]">★</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-[#FF6200] text-black font-bold px-3 py-1 rounded-full text-sm">
                        -{transformation.weightLost}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-white font-bold text-lg">{transformation.name}</h3>
                      <p className="text-zinc-500 text-sm mb-3">{transformation.location}</p>
                      <div className="flex items-center gap-2 mb-3">
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 bg-[#FF6200] rounded-full flex items-center justify-center text-black hover:bg-[#FF8533] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 bg-[#FF6200] rounded-full flex items-center justify-center text-black hover:bg-[#FF8533] transition-colors"
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
