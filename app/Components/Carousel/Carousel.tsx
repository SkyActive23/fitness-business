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
  { src: "/images/wrestling-fitness.jpg", alt: "wrestling" },
];

export default function Carousel() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: images.length, // All images visible in one row
      spacing: 5, // Add spacing between images
    },
    created: (s) => {
      timerRef.current = setInterval(() => {
        s.next();
      }, 10000); // 10 seconds
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
      <div
        ref={sliderRef}
        className="keen-slider w-full flex justify-between"
      >
        {images.map((img, index) => (
            <div
                key={index}
                className={`keen-slider__slide flex justify-center items-center ${
                index === 0 ? "ml-4" : index === images.length - 1 ? "mr-4" : ""
                }`}
                style={{ width: "50px", height: "50px" }}
            >
                <Image
                src={img.src}
                alt={img.alt}
                width={50}
                height={50}
                className="rounded shadow-md object-cover"
                priority={index === 0}
                />
            </div>
            ))}
      </div>
    </div>
  );
}
