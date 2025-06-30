// src/app/Components/Background/BackgroundLogo.tsx
"use client";

import Image from "next/image";

interface BackgroundLogoProps {
  opacity?: number; // optional custom opacity
  size?: number;    // optional custom width/height
  position?: "center" | "top-left" | "bottom-right"; // optional placement
}

const BackgroundLogo = ({
  opacity = 0.05,
  size = 400,
  position = "center",
}: BackgroundLogoProps) => {
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-0 left-0";
      case "bottom-right":
        return "bottom-0 right-0";
      case "center":
      default:
        return "inset-0 flex items-center justify-center";
    }
  };

  return (
    <div
      className={`absolute ${getPositionStyles()} z-0 pointer-events-none`}
      style={{ opacity }}
    >
      <Image
        src="/images/logos/logo.png"
        alt="Background Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  );
};

export default BackgroundLogo;
