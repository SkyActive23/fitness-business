"use client";
import { useEffect, useRef } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import Image from "next/image";

const images = [
  { src: "/images/baseball-fitness.jpg", alt: "Baseball" },
  { src: "/images/basketball-fitness.jpg", alt: "Basketball" },
  { src: "/images/soccer-fitness.jpg", alt: "Soccer" },
  { src: "/images/football-fitness.jpg", alt: "Football" },
  { src: "/images/softball-fitness.jpg", alt: "Softball" },
  { src: "/images/track-fitness.jpg", alt: "Track" },
  { src: "/images/volleyball-fitness.jpg", alt: "Volleyball" },
  { src: "/images/wrestling-fitness.jpg", alt: "Wrestling" },
];

export default function Carousel() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    breakpoints: {
      "(min-width: 1024px)": {
        slides: { perView: images.length, spacing: 10 },
      },
      "(min-width: 768px)": {
        slides: { perView: 5, spacing: 8 },
      },
    },
    slides: { perView: 3, spacing: 6 }, // Default mobile
    created: (s) => {
      timerRef.current = setInterval(() => {
        s.next();
      }, 7000); // Auto-scroll every 7s
    },
    destroyed: () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="w-full px-4">
      <div ref={sliderRef} className="keen-slider">
        {images.map((img, index) => (
          <div
            key={index}
            className="keen-slider__slide flex justify-center items-center"
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={80}
              height={80}
              className="rounded-2xl shadow-md object-cover sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] lg:w-[80px] lg:h-[80px]"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
