"use client";

import { useEffect, useState, type CSSProperties } from "react";
import "./starry-sky.css";

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  peak: number;
};

function buildStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.4 + 0.6,
    delay: Math.random() * 10,
    duration: 2.5 + Math.random() * 5,
    peak: 0.25 + Math.random() * 0.45,
  }));
}

export function StarrySky() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(buildStars(110));
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="starry-sky" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="starry-sky-star"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              "--star-peak": star.peak,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
