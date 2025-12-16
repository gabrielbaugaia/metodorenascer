import { useState, useEffect } from "react";
import { Flame } from "lucide-react";

export function PreLaunchHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md border-b border-border' 
          : 'bg-transparent'
      }`}
      style={{ top: '44px' }} // Account for urgency banner
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16 md:h-20">
          {/* Logo centered */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-lg md:text-xl text-foreground tracking-wider">RENASCER</span>
          </div>
        </div>
      </div>
    </header>
  );
}
