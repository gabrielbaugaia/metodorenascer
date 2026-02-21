import { useEffect, useState } from "react";

interface MiniConfettiProps {
  active: boolean;
}

const PARTICLE_COUNT = 14;
const COLORS = [
  "hsl(14 100% 62%)",    // primary orange
  "hsl(14 80% 72%)",     // lighter orange
  "hsl(25 90% 55%)",     // warm amber
  "hsl(0 0% 85%)",       // neutral light
  "hsl(0 0% 65%)",       // neutral mid
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function MiniConfetti({ active }: MiniConfettiProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const color = COLORS[i % COLORS.length];
    const left = randomBetween(25, 75);
    const size = randomBetween(4, 6);
    const delay = randomBetween(0, 200);
    const xDrift = randomBetween(-20, 20);
    const rotation = randomBetween(0, 360);

    return (
      <div
        key={i}
        className="absolute rounded-sm pointer-events-none"
        style={{
          left: `${left}%`,
          top: "40%",
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          animation: `confettiFall 900ms ${delay}ms ease-out forwards`,
          transform: `rotate(${rotation}deg)`,
          ["--x-drift" as string]: `${xDrift}px`,
          opacity: 0,
        }}
      />
    );
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles}
    </div>
  );
}
